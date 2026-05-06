"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminUser } from "@/lib/auth/guards";
import { normalizeReservationStatus } from "@/lib/reservation-status";
import { STORAGE_BUCKET } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueSlug } from "@/lib/slugify";

function normalizeDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function eachDateInRange(start: string, end: string) {
  const dates: string[] = [];
  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function safeStorageFileName(name: string) {
  const trimmed = name.trim().slice(0, 180);
  const base = trimmed.replace(/[^\w.\-]+/g, "_");
  return base || "upload";
}

function reservationStatusCandidates(durum: string): string[] {
  if (durum === "onaylandi") return ["onaylandi", "approved"];
  if (durum === "iptal") return ["iptal", "cancelled", "rejected"];
  return ["beklemede", "pending", "onay_bekliyor", "odeme_bekleniyor"];
}

async function syncReservationAvailability(
  supabase: SupabaseClient,
  reservationId: string,
  durum: string,
) {
  const { data: reservation } = await supabase
    .from("rezervasyonlar")
    .select("id,ilan_id,giris_tarihi,cikis_tarihi")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation) return;

  const start = normalizeDate(reservation.giris_tarihi);
  const end = normalizeDate(reservation.cikis_tarihi);
  end.setDate(end.getDate() - 1);
  if (end < start) return;

  const dates = eachDateInRange(formatDate(start), formatDate(end));
  if (!dates.length) return;

  if (durum === "onaylandi") {
    await supabase.from("musaitlik").upsert(
      dates.map((tarih) => ({
        ilan_id: reservation.ilan_id,
        tarih,
        durum: "dolu",
        fiyat_override: null,
      })),
      { onConflict: "ilan_id,tarih" },
    );
    return;
  }

  if (durum === "iptal") {
    await supabase
      .from("musaitlik")
      .delete()
      .eq("ilan_id", reservation.ilan_id)
      .in("tarih", dates);
  }
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function assertAdmin(): Promise<
  { ok: true; supabase: AdminClient } | { ok: false; error: string }
> {
  const auth = await requireAdminUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  return { ok: true, supabase: createAdminClient() };
}

export async function approveOrRejectListing(formData: FormData) {
  const admin = await assertAdmin();
  if (!admin.ok) return;

  const id = String(formData.get("id") ?? "");
  const aktif = String(formData.get("aktif") ?? "") === "true";
  const supabase = admin.supabase;
  await supabase.from("ilanlar").update({ aktif }).eq("id", id);
  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/");
  revalidatePath("/konaklama");
  revalidatePath("/tekneler");
  revalidatePath("/panel/ilanlarim");
}

export async function deleteAnyListing(formData: FormData) {
  const admin = await assertAdmin();
  if (!admin.ok) return;

  const id = String(formData.get("id") ?? "");
  const supabase = admin.supabase;
  await supabase.from("ilanlar").delete().eq("id", id);
  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/");
  revalidatePath("/konaklama");
  revalidatePath("/tekneler");
  revalidatePath("/panel/ilanlarim");
}

export async function createAdminPackage(formData: FormData) {
  const admin = await assertAdmin();
  if (!admin.ok) return { success: false as const, error: admin.error };

  const supabase = admin.supabase;
  const ilanIdleri = formData.getAll("ilan_idleri").map((item) => String(item));
  if (ilanIdleri.length < 2) {
    return { success: false as const, error: "Paket icin en az iki ilan secmelisiniz." };
  }

  const { data: ilanlar, error: ilanErr } = await supabase
    .from("ilanlar")
    .select("id,tip")
    .in("id", ilanIdleri);
  if (ilanErr || !ilanlar?.length) {
    return { success: false as const, error: "Secilen ilanlar dogrulanamadi." };
  }
  const hasVilla = ilanlar.some((row) => row.tip === "villa");
  const hasTekne = ilanlar.some((row) => row.tip === "tekne");
  if (!hasVilla || !hasTekne) {
    return { success: false as const, error: "Paket olusturmak icin en az 1 villa ve 1 tekne secin." };
  }

  const baslik = String(formData.get("baslik") ?? "");
  const slug = await generateUniqueSlug(supabase, baslik, "paketler");

  const { data: inserted, error: insertError } = await supabase
    .from("paketler")
    .insert({
      baslik,
      kategori: String(formData.get("kategori") ?? "macera"),
      aciklama: String(formData.get("aciklama") ?? ""),
      sure_gun: Number(formData.get("sure_gun") ?? 1),
      kapasite: Number(formData.get("kapasite") ?? 1),
      fiyat: Number(formData.get("fiyat") ?? 0),
      ilan_idleri: ilanIdleri,
      slug,
      aktif: true,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { success: false as const, error: insertError?.message ?? "Paket oluşturulamadı." };
  }

  const coverFile = formData.get("cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const path = `paketler/${inserted.id}/cover-${Date.now()}-${safeStorageFileName(coverFile.name)}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, coverFile, {
      upsert: true,
      contentType: coverFile.type || "image/jpeg",
    });
    if (uploadError) {
      return { success: false as const, error: "Kapak görseli yüklenemedi." };
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

    await supabase.from("paket_medyalari").insert({
      paket_id: inserted.id,
      url: publicUrl,
      tip: "kapak",
      sira: 1,
    });

    await supabase.from("paketler").update({ gorsel_url: publicUrl }).eq("id", inserted.id);
  }

  const detailFiles = formData
    .getAll("detay_files")
    .filter((file): file is File => file instanceof File && file.size > 0);
  if (detailFiles.length) {
    let detailOrder = 1;
    for (const detailFile of detailFiles) {
      const path = `paketler/${inserted.id}/detail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeStorageFileName(detailFile.name)}`;
      const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, detailFile, {
        upsert: true,
        contentType: detailFile.type || "image/jpeg",
      });
      if (uploadError) continue;
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      await supabase.from("paket_medyalari").insert({
        paket_id: inserted.id,
        url: publicUrl,
        tip: "detay",
        sira: detailOrder,
      });
      detailOrder += 1;
    }
  }

  revalidatePath("/yonetim/paketler");
  revalidatePath("/paketler");
  return { success: true as const };
}

export async function updateAdminPackageStatus(formData: FormData) {
  const admin = await assertAdmin();
  if (!admin.ok) return;

  const id = String(formData.get("id") ?? "");
  const aktif = String(formData.get("aktif") ?? "") === "true";
  await admin.supabase.from("paketler").update({ aktif }).eq("id", id);
  revalidatePath("/yonetim/paketler");
}

export async function deleteAdminPackage(formData: FormData) {
  const admin = await assertAdmin();
  if (!admin.ok) return;

  const id = String(formData.get("id") ?? "");
  await admin.supabase.from("paketler").delete().eq("id", id);
  revalidatePath("/yonetim/paketler");
}

export async function updateUserRole(formData: FormData) {
  const admin = await assertAdmin();
  if (!admin.ok) return;

  const id = String(formData.get("id") ?? "");
  const rol = String(formData.get("rol") ?? "ziyaretci");
  const supabase = admin.supabase;
  await supabase.from("kullanicilar").update({ rol }).eq("id", id);
  revalidatePath("/yonetim/kullanicilar");
}

export async function updateReservationByAdmin(formData: FormData) {
  const admin = await assertAdmin();
  if (!admin.ok) return { success: false as const, error: admin.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false as const, error: "Rezervasyon bulunamadı." };
  const normalizedDurum = normalizeReservationStatus(String(formData.get("durum") ?? "beklemede"));
  const supabase = admin.supabase;
  let appliedDurum: string | null = null;

  for (const candidate of reservationStatusCandidates(normalizedDurum)) {
    const { error: updateError, data: updatedRows } = await supabase
      .from("rezervasyonlar")
      .update({ durum: candidate })
      .eq("id", id)
      .select("id")
      .limit(1);
    if (!updateError && updatedRows?.length) {
      appliedDurum = candidate;
      break;
    }
  }

  if (!appliedDurum) {
    return { success: false as const, error: "Rezervasyon durumu güncellenemedi." };
  }

  try {
    await syncReservationAvailability(supabase, id, normalizeReservationStatus(appliedDurum));
  } catch {
    return { success: false as const, error: "Durum güncellendi ancak müsaitlik eşitlemesi başarısız oldu." };
  }
  revalidatePath("/yonetim/rezervasyonlar");
  return { success: true as const, durum: normalizeReservationStatus(appliedDurum) };
}

type SetAvailabilityRangeInput = {
  ilanId: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  durum: "musait" | "dolu" | "ozel_fiyat";
  fiyatOverride?: number | null;
};

export async function setAvailabilityRangeByAdmin(input: SetAvailabilityRangeInput) {
  const admin = await assertAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = admin.supabase;
  const dates = eachDateInRange(input.baslangicTarihi, input.bitisTarihi);

  if (!dates.length) {
    return { success: false, error: "Geçerli tarih aralığı seçin." };
  }

  if (input.durum === "musait") {
    const { error } = await supabase
      .from("musaitlik")
      .delete()
      .eq("ilan_id", input.ilanId)
      .in("tarih", dates);
    if (error) return { success: false, error: "Müsaitlik güncellenemedi." };
  } else {
    const { error } = await supabase.from("musaitlik").upsert(
      dates.map((tarih) => ({
        ilan_id: input.ilanId,
        tarih,
        durum: input.durum,
        fiyat_override: input.fiyatOverride ?? null,
      })),
      { onConflict: "ilan_id,tarih" },
    );
    if (error) return { success: false, error: "Müsaitlik güncellenemedi." };
  }

  revalidatePath(`/yonetim/ilanlar/${input.ilanId}/takvim`);
  return { success: true };
}

type CreateSeasonPriceInput = {
  ilanId: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  gunlukFiyat: number;
};

export async function createSeasonPriceByAdmin(input: CreateSeasonPriceInput) {
  const admin = await assertAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const { error } = await admin.supabase.from("sezon_fiyatlari").insert({
    ilan_id: input.ilanId,
    baslangic_tarihi: input.baslangicTarihi,
    bitis_tarihi: input.bitisTarihi,
    gunluk_fiyat: input.gunlukFiyat,
  });

  if (error) return { success: false, error: "Sezon fiyatı kaydedilemedi." };

  revalidatePath(`/yonetim/ilanlar/${input.ilanId}/takvim`);
  return { success: true };
}

export async function deleteSeasonPriceByAdmin(seasonPriceId: string, ilanId: string) {
  const admin = await assertAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const { error } = await admin.supabase
    .from("sezon_fiyatlari")
    .delete()
    .eq("id", seasonPriceId);

  if (error) return { success: false, error: "Sezon fiyatı silinemedi." };

  revalidatePath(`/yonetim/ilanlar/${ilanId}/takvim`);
  return { success: true };
}

