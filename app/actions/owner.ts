"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuthenticatedUser,
  requireOwnerListingAccess,
  requireOwnerReservationAccess,
} from "@/lib/auth/guards";
import { STORAGE_BUCKET } from "@/lib/constants";
import { normalizeReservationStatus } from "@/lib/reservation-status";
import { storageUploadUserMessage } from "@/lib/storage-upload-messages";
import { eachDateInRangeYmd, ymdFromLocalDate } from "@/lib/availability-dates";
import { insertAdminNotification } from "@/lib/admin-notifications";
import { LISTING_ONAY_DURUMU } from "@/lib/listing-approval";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateFromYmdLocal } from "@/lib/tr-today";
import { generateUniqueSlug } from "@/lib/slugify";

function revalidateListingCalendar(ilanId: string) {
  revalidatePath("/panel/takvim");
  revalidatePath(`/yonetim/ilanlar/${ilanId}/takvim`);
}

function normalizeDate(value: string) {
  return dateFromYmdLocal(value);
}

function safeStorageFileName(name: string) {
  const trimmed = name.trim().slice(0, 180);
  const base = trimmed.replace(/[^\w.\-]+/g, "_");
  return base || "upload";
}

export async function deleteListing(formData: FormData) {
  const listingId = String(formData.get("listing_id") ?? "");
  const access = await requireOwnerListingAccess(listingId);
  if (!access.ok) return;
  const supabase = access.supabase;

  await supabase.from("ilanlar").delete().eq("id", listingId);
  revalidatePath("/panel/ilanlarim");
  revalidatePath("/panel/rezervasyonlar");
  revalidatePath("/");
  revalidatePath("/konaklama");
  revalidatePath("/tekneler");
}

export async function createOwnerPackage(formData: FormData) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return { success: false, error: auth.error };
  const supabase = auth.supabase;

  const baslik = String(formData.get("baslik") ?? "").trim();
  const aciklama = String(formData.get("aciklama") ?? "").trim();
  const kategori = String(formData.get("kategori") ?? "macera");
  const sure_gun = Number(formData.get("sure_gun") ?? 1);
  const kapasite = Number(formData.get("kapasite") ?? 1);
  const fiyat = Number(formData.get("fiyat") ?? 0);

  let ilan_idleri: string[] = [];
  try {
    ilan_idleri = JSON.parse(String(formData.get("ilan_idleri") ?? "[]")) as string[];
  } catch {
    return { success: false, error: "Ilan listesi okunamadi." };
  }

  if (!baslik || baslik.length < 10) return { success: false, error: "Baslik en az 10 karakter olmali." };
  if (!aciklama || aciklama.length < 50) return { success: false, error: "Aciklama en az 50 karakter olmali." };
  if (ilan_idleri.length < 2) return { success: false, error: "En az iki ilan secmelisiniz." };
  if (fiyat < 100) return { success: false, error: "Fiyat en az 100 TL olmali." };

  const { data: ilanlar, error: ilanErr } = await supabase
    .from("ilanlar")
    .select("id,tip,sahip_id")
    .in("id", ilan_idleri);

  if (ilanErr || !ilanlar?.length) return { success: false, error: "Ilanlar yuklenemedi." };
  if (ilanlar.length !== ilan_idleri.length) return { success: false, error: "Gecersiz ilan secimi." };
  if (ilanlar.some((row) => row.sahip_id !== auth.user.id)) {
    return { success: false, error: "Sadece kendi ilanlarinizi pakete ekleyebilirsiniz." };
  }

  const hasVilla = ilanlar.some((row) => row.tip === "villa");
  const hasTekne = ilanlar.some((row) => row.tip === "tekne");
  if (!hasVilla || !hasTekne) {
    return { success: false, error: "Paket icin en az bir villa ve bir tekne secmelisiniz." };
  }

  const slug = await generateUniqueSlug(supabase, baslik, "paketler");

  const { error } = await supabase.from("paketler").insert({
    baslik,
    aciklama,
    kategori,
    sure_gun,
    kapasite,
    fiyat,
    ilan_idleri,
    slug,
    aktif: false,
  });

  if (error) return { success: false, error: error.message ?? "Paket olusturulamadi." };

  revalidatePath("/panel/ilanlarim");
  revalidatePath("/paketler");
  return { success: true };
}

export async function createListing(formData: FormData) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return { success: false, error: auth.error };
  const supabase = auth.supabase;

  const baslik = String(formData.get("baslik") ?? "");
  const aciklama = String(formData.get("aciklama") ?? "");
  const tip = String(formData.get("tip") ?? "villa");
  const konum = String(formData.get("konum") ?? "");
  const kapasite = Number(formData.get("kapasite") ?? 1);
  const yatak_odasi = Number(formData.get("yatak_odasi") ?? 1);
  const banyo = Number(formData.get("banyo") ?? 1);
  const gunluk_fiyat = Number(formData.get("gunluk_fiyat") ?? 0);
  const temizlik_ucreti = Number(formData.get("temizlik_ucreti") ?? 0);
  const ozellikler = JSON.parse(String(formData.get("ozellikler") ?? "{}"));
  const medya = formData.getAll("medya") as File[];

  const slug = await generateUniqueSlug(supabase, baslik, "ilanlar");

  const { data: inserted, error } = await supabase
    .from("ilanlar")
    .insert({
      sahip_id: auth.user.id,
      tip,
      baslik,
      aciklama,
      slug,
      konum,
      kapasite,
      yatak_odasi,
      banyo,
      gunluk_fiyat,
      temizlik_ucreti,
      ozellikler,
      aktif: false,
      onay_durumu: LISTING_ONAY_DURUMU.PENDING,
      sponsorlu: false,
    })
    .select("id")
    .single();

  if (error || !inserted) return { success: false, error: "Ilan olusturulamadi." };

  const filesToUpload = medya.filter((f): f is File => Boolean(f && f.size > 0));
  let mediaIndex = 0;
  let lastMediaError: string | null = null;

  for (const file of filesToUpload) {
    mediaIndex += 1;
    const path = `${inserted.id}/${Date.now()}-${safeStorageFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true });
    if (uploadError) {
      lastMediaError = storageUploadUserMessage(uploadError.message);
      continue;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const { error: insertMediaError } = await supabase.from("ilan_medyalari").insert({
      ilan_id: inserted.id,
      url: publicUrl,
      tip: "resim",
      sira: mediaIndex,
    });
    if (insertMediaError) {
      lastMediaError =
        insertMediaError.message?.trim() ||
        "Fotograf veritabanina kaydedilemedi (ilan_medyalari). Supabase RLS veya sema kontrol edin.";
    }
  }

  if (filesToUpload.length > 0) {
    const { count, error: countErr } = await supabase
      .from("ilan_medyalari")
      .select("id", { count: "exact", head: true })
      .eq("ilan_id", inserted.id);
    if (countErr || !count) {
      await supabase.from("ilanlar").delete().eq("id", inserted.id);
      return {
        success: false,
        error:
          lastMediaError ??
          countErr?.message?.trim() ??
          "Fotograflar yuklenemedi. Baglantiyi ve dosya boyutunu kontrol edip tekrar deneyin.",
      };
    }
  }

  try {
    await insertAdminNotification({
      tip: "yeni_ilan",
      baslik: "Yeni ilan onay bekliyor",
      mesaj: `"${baslik.trim()}" başlıklı ilan incelemenizi bekliyor.`,
      entity_tip: "ilan",
      entity_id: inserted.id,
    });
  } catch (e) {
    console.error("[createListing] admin bildirimi:", e);
  }

  revalidatePath("/panel/ilanlarim");
  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/yonetim");
  return { success: true };
}

export async function upsertAvailability(formData: FormData) {
  const ilanId = String(formData.get("ilan_id") ?? "");
  const access = await requireOwnerListingAccess(ilanId);
  if (!access.ok) return { success: false, error: access.error };
  const db = createAdminClient();

  const { error } = await db.from("musaitlik").upsert(
    {
      ilan_id: ilanId,
      tarih: String(formData.get("tarih") ?? ""),
      durum: String(formData.get("durum") ?? "musait"),
      fiyat_override: Number(formData.get("fiyat_override") ?? 0) || null,
    },
    { onConflict: "ilan_id,tarih" },
  );
  if (error) return { success: false, error: error.message };
  revalidateListingCalendar(ilanId);
  return { success: true };
}

export type SetOwnerAvailabilityRangeInput = {
  ilanId: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  durum: "musait" | "dolu" | "ozel_fiyat";
  fiyatOverride?: number | null;
};

export async function setOwnerAvailabilityRange(input: SetOwnerAvailabilityRangeInput) {
  const access = await requireOwnerListingAccess(input.ilanId);
  if (!access.ok) return { success: false as const, error: access.error };

  const db = createAdminClient();
  const dates = eachDateInRangeYmd(input.baslangicTarihi, input.bitisTarihi);
  if (!dates.length) {
    return { success: false as const, error: "Geçerli bir tarih aralığı seçin." };
  }

  if (input.durum === "musait") {
    const { error } = await db
      .from("musaitlik")
      .delete()
      .eq("ilan_id", input.ilanId)
      .in("tarih", dates);
    if (error) return { success: false as const, error: error.message };
  } else {
    const { error } = await db.from("musaitlik").upsert(
      dates.map((tarih) => ({
        ilan_id: input.ilanId,
        tarih,
        durum: input.durum,
        fiyat_override: input.durum === "ozel_fiyat" ? (input.fiyatOverride ?? null) : null,
      })),
      { onConflict: "ilan_id,tarih" },
    );
    if (error) return { success: false as const, error: error.message };
  }

  revalidateListingCalendar(input.ilanId);
  return { success: true as const };
}

export async function setAvailabilityRangeByOwner(formData: FormData) {
  const result = await setOwnerAvailabilityRange({
    ilanId: String(formData.get("ilan_id") ?? ""),
    baslangicTarihi: String(formData.get("baslangic_tarihi") ?? ""),
    bitisTarihi: String(formData.get("bitis_tarihi") ?? ""),
    durum: String(formData.get("durum") ?? "musait") as SetOwnerAvailabilityRangeInput["durum"],
    fiyatOverride: Number(formData.get("fiyat_override") ?? 0) || null,
  });
  if (!result.success) throw new Error(result.error);
}

export type CreateOwnerSeasonPriceInput = {
  ilanId: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  gunlukFiyat: number;
};

export async function createOwnerSeasonPrice(input: CreateOwnerSeasonPriceInput) {
  const access = await requireOwnerListingAccess(input.ilanId);
  if (!access.ok) return { success: false as const, error: access.error };

  const { error } = await access.supabase.from("sezon_fiyatlari").insert({
    ilan_id: input.ilanId,
    baslangic_tarihi: input.baslangicTarihi,
    bitis_tarihi: input.bitisTarihi,
    gunluk_fiyat: input.gunlukFiyat,
  });

  if (error) return { success: false as const, error: "Sezon fiyatı kaydedilemedi." };

  revalidatePath("/panel/fiyat");
  revalidatePath("/panel/takvim");
  return { success: true as const };
}

export async function upsertSeasonPrice(formData: FormData) {
  const result = await createOwnerSeasonPrice({
    ilanId: String(formData.get("ilan_id") ?? ""),
    baslangicTarihi: String(formData.get("baslangic_tarihi") ?? ""),
    bitisTarihi: String(formData.get("bitis_tarihi") ?? ""),
    gunlukFiyat: Number(formData.get("gunluk_fiyat") ?? 0),
  });
  if (!result.success) throw new Error(result.error);
}

export async function deleteOwnerSeasonPrice(seasonPriceId: string) {
  const auth = await requireAuthenticatedOwner();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { data: seasonPrice } = await auth.supabase
    .from("sezon_fiyatlari")
    .select("id,ilan_id")
    .eq("id", seasonPriceId)
    .maybeSingle();

  if (!seasonPrice) {
    return { success: false as const, error: "Sezon fiyat kaydı bulunamadı." };
  }

  const listingAccess = await requireOwnerListingAccess(seasonPrice.ilan_id);
  if (!listingAccess.ok) return { success: false as const, error: listingAccess.error };

  const { error } = await listingAccess.supabase
    .from("sezon_fiyatlari")
    .delete()
    .eq("id", seasonPriceId);

  if (error) return { success: false as const, error: "Sezon fiyatı silinemedi." };

  revalidatePath("/panel/fiyat");
  revalidatePath("/panel/takvim");
  return { success: true as const };
}

export async function deleteSeasonPriceByOwner(formData: FormData) {
  const result = await deleteOwnerSeasonPrice(String(formData.get("id") ?? ""));
  if (!result.success) throw new Error(result.error);
}

async function requireAuthenticatedOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Oturum bulunamadi." };
  return { ok: true as const, user, supabase };
}

export async function updateReservationStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const access = await requireOwnerReservationAccess(id);
  if (!access.ok) throw new Error(access.error);
  const supabase = access.supabase;
  const durum = normalizeReservationStatus(String(formData.get("durum") ?? "pending"));
  await supabase.from("rezervasyonlar").update({ durum }).eq("id", id);
  const { data: reservation } = await supabase
    .from("rezervasyonlar")
    .select("ilan_id,giris_tarihi,cikis_tarihi")
    .eq("id", id)
    .maybeSingle();

  if (reservation) {
    const start = normalizeDate(reservation.giris_tarihi);
    const end = normalizeDate(reservation.cikis_tarihi);
    end.setDate(end.getDate() - 1);

    if (end >= start) {
      const dates = eachDateInRangeYmd(ymdFromLocalDate(start), ymdFromLocalDate(end));
      const db = createAdminClient();
      if (durum === "approved") {
        await db.from("musaitlik").upsert(
          dates.map((tarih) => ({
            ilan_id: reservation.ilan_id,
            tarih,
            durum: "dolu",
            fiyat_override: null,
          })),
          { onConflict: "ilan_id,tarih" },
        );
      }
      if (durum === "cancelled") {
        await db.from("musaitlik").delete().eq("ilan_id", reservation.ilan_id).in("tarih", dates);
      }
    }
  }

  revalidatePath("/panel/talepler");
}
