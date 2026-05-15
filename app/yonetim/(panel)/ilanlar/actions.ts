"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueSlug } from "@/lib/slugify";
import { insertAdminNotification } from "@/lib/admin-notifications";
import { recordAdminAction } from "@/lib/admin-log";
import { LISTING_ONAY_DURUMU } from "@/lib/listing-approval";

function composeKonum(bolgeRaw: FormDataEntryValue | null, locationRaw: FormDataEntryValue | null) {
  const bolge = String(bolgeRaw ?? "").trim();
  const location = String(locationRaw ?? "").trim();
  if (!bolge) return location;
  if (!location) return bolge;
  if (location.toLocaleLowerCase("tr").startsWith(bolge.toLocaleLowerCase("tr"))) return location;
  return `${bolge} - ${location}`;
}

export async function createListing(formData: FormData) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) throw new Error(admin.error);
  const supabase = admin.supabase;
  const konum = composeKonum(formData.get("bolge"), formData.get("location") ?? formData.get("konum"));
  const baslik = String(formData.get("title") ?? formData.get("baslik") ?? "");
  const slug = await generateUniqueSlug(supabase, baslik, "ilanlar");
  const payload = {
    baslik,
    aciklama: String(formData.get("description") ?? formData.get("aciklama") ?? ""),
    gunluk_fiyat: Number(formData.get("price") ?? formData.get("gunluk_fiyat") ?? 0),
    konum,
    slug,
    aktif: true,
    onay_durumu: LISTING_ONAY_DURUMU.PUBLISHED,
  };
  const { error } = await supabase.from("ilanlar").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/yonetim/ilanlar");
}

export async function createAdminListing(formData: FormData) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) return { success: false as const, error: admin.error };

  const ozelliklerRaw = String(formData.get("ozellikler") ?? "{}");
  let ozellikler: Record<string, unknown> = {};
  try {
    ozellikler = JSON.parse(ozelliklerRaw) as Record<string, unknown>;
  } catch {
    ozellikler = {};
  }

  const konum = composeKonum(formData.get("bolge"), formData.get("location") ?? formData.get("konum"));
  const baslik = String(formData.get("title") ?? formData.get("baslik") ?? "");
  const slug = await generateUniqueSlug(admin.supabase, baslik, "ilanlar");
  const payload = {
    tip: String(formData.get("tip") ?? "villa"),
    baslik,
    aciklama: String(formData.get("description") ?? formData.get("aciklama") ?? ""),
    gunluk_fiyat: Number(formData.get("price") ?? formData.get("gunluk_fiyat") ?? 0),
    temizlik_ucreti: Number(formData.get("temizlik_ucreti") ?? 0),
    konum,
    kapasite: Number(formData.get("kapasite") ?? 1),
    yatak_odasi: Number(formData.get("yatak_odasi") ?? 1),
    banyo: Number(formData.get("banyo") ?? 1),
    ozellikler,
    slug,
    aktif: true,
    onay_durumu: LISTING_ONAY_DURUMU.PUBLISHED,
  };
  const coverIndex = Number(formData.get("cover_index") ?? 0);
  const files = formData.getAll("medya").filter((f): f is File => f instanceof File && f.size > 0);

  if (
    !payload.baslik ||
    !payload.konum ||
    Number.isNaN(payload.gunluk_fiyat) ||
    Number.isNaN(payload.kapasite) ||
    Number.isNaN(payload.yatak_odasi) ||
    Number.isNaN(payload.banyo)
  ) {
    return { success: false as const, error: "Eksik veya hatali alan var." };
  }

  const { data: inserted, error } = await admin.supabase.from("ilanlar").insert(payload).select("id").single();
  if (error || !inserted) {
    return { success: false as const, error: error?.message ?? "Ilan olusturulamadi." };
  }

  if (files.length > 0) {
    const orderedFiles = [...files];
    if (coverIndex >= 0 && coverIndex < orderedFiles.length) {
      const [cover] = orderedFiles.splice(coverIndex, 1);
      orderedFiles.unshift(cover);
    }

    let nextOrder = 1;
    for (const file of orderedFiles) {
      const safeName = normalizeFileName(file.name || "image.jpg");
      const objectPath = `${inserted.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error: uploadError } = await admin.supabase.storage
        .from(MEDIA_BUCKET)
        .upload(objectPath, file, { upsert: false, contentType: file.type || "image/jpeg" });
      if (uploadError) {
        return { success: false as const, error: `Dosya yuklenemedi: ${uploadError.message}` };
      }
      const { data: publicData } = admin.supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
      const { error: mediaError } = await admin.supabase.from("ilan_medyalari").insert({
        ilan_id: inserted.id,
        url: publicData.publicUrl,
        tip: "resim",
        sira: nextOrder,
      });
      if (mediaError) {
        return { success: false as const, error: `Gorsel kaydedilemedi: ${mediaError.message}` };
      }
      nextOrder += 1;
    }
  }

  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/");
  revalidatePath("/konaklama");
  revalidatePath("/tekneler");
  return { success: true as const };
}

export async function updateListing(id: string, formData: FormData) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) throw new Error(admin.error);
  const supabase = admin.supabase;
  const konum = composeKonum(formData.get("bolge"), formData.get("location") ?? formData.get("konum"));
  const payload = {
    baslik: String(formData.get("title") ?? formData.get("baslik") ?? ""),
    aciklama: String(formData.get("description") ?? formData.get("aciklama") ?? ""),
    gunluk_fiyat: Number(formData.get("price") ?? formData.get("gunluk_fiyat") ?? 0),
    konum,
  };
  const { error } = await supabase.from("ilanlar").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/yonetim/ilanlar");
}

export async function deleteListing(id: string) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) throw new Error(admin.error);
  const supabase = admin.supabase;
  const { error } = await supabase.from("ilanlar").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAdminAction({ islem: "ilan_silindi", entityTip: "ilan", entityId: id });
  revalidatePath("/yonetim/ilanlar");
}

export async function approveListing(listingId: string) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) return { success: false as const, error: admin.error };

  const { data: listing, error: fetchError } = await admin.supabase
    .from("ilanlar")
    .select("id,baslik,sahip_id")
    .eq("id", listingId)
    .maybeSingle();
  if (fetchError || !listing) {
    return { success: false as const, error: fetchError?.message ?? "İlan bulunamadı." };
  }

  const { error } = await admin.supabase
    .from("ilanlar")
    .update({ aktif: true, onay_durumu: LISTING_ONAY_DURUMU.PUBLISHED })
    .eq("id", listingId);
  if (error) return { success: false as const, error: error.message };

  await insertAdminNotification({
    tip: "bilgi",
    baslik: "İlanınız yayına alındı",
    mesaj: `"${listing.baslik ?? "İlanınız"}" onaylandı ve sitede yayınlanıyor.`,
    entity_tip: "ilan",
    entity_id: listingId,
    hedef_kullanici_id: listing.sahip_id ? String(listing.sahip_id) : undefined,
  });

  await recordAdminAction({
    islem: "ilan_onaylandi",
    entityTip: "ilan",
    entityId: listingId,
    entityBaslik: listing.baslik,
  });

  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/yonetim");
  revalidatePath("/panel/ilanlarim");
  revalidatePath("/");
  revalidatePath("/konaklama");
  revalidatePath("/tekneler");
  return { success: true as const };
}

export async function rejectListing(listingId: string, neden?: string) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) return { success: false as const, error: admin.error };

  const reason = (neden ?? "").trim();
  const { data: listing, error: fetchError } = await admin.supabase
    .from("ilanlar")
    .select("id,baslik,sahip_id")
    .eq("id", listingId)
    .maybeSingle();
  if (fetchError || !listing) {
    return { success: false as const, error: fetchError?.message ?? "İlan bulunamadı." };
  }

  const { error } = await admin.supabase
    .from("ilanlar")
    .update({ aktif: false, onay_durumu: LISTING_ONAY_DURUMU.REJECTED })
    .eq("id", listingId);
  if (error) return { success: false as const, error: error.message };

  const mesaj = reason
    ? `"${listing.baslik ?? "İlanınız"}" reddedildi. Neden: ${reason}`
    : `"${listing.baslik ?? "İlanınız"}" reddedildi. Detay için destek ile iletişime geçebilirsiniz.`;

  await insertAdminNotification({
    tip: "bilgi",
    baslik: "İlan başvurunuz reddedildi",
    mesaj,
    entity_tip: "ilan",
    entity_id: listingId,
    hedef_kullanici_id: listing.sahip_id ? String(listing.sahip_id) : undefined,
  });

  await recordAdminAction({
    islem: "ilan_reddedildi",
    entityTip: "ilan",
    entityId: listingId,
    entityBaslik: listing.baslik,
    detaylar: reason ? { neden: reason } : null,
  });

  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/yonetim");
  revalidatePath("/panel/ilanlarim");
  return { success: true as const };
}

export async function bulkDeactivateListings(ids: string[]) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) return { success: false as const, error: admin.error };
  const cleanIds = ids.filter(Boolean);
  if (!cleanIds.length) return { success: false as const, error: "İlan seçin." };

  const { error } = await admin.supabase.from("ilanlar").update({ aktif: false }).in("id", cleanIds);
  if (error) return { success: false as const, error: error.message };
  await recordAdminAction({
    islem: "ilan_pasife_alindi",
    entityTip: "ilan",
    entityId: cleanIds.join(","),
    detaylar: { adet: cleanIds.length },
  });
  revalidatePath("/yonetim/ilanlar");
  return { success: true as const };
}

export async function bulkDeleteListings(ids: string[]) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) return { success: false as const, error: admin.error };
  const cleanIds = ids.filter(Boolean);
  if (!cleanIds.length) return { success: false as const, error: "İlan seçin." };

  const { error } = await admin.supabase.from("ilanlar").delete().in("id", cleanIds);
  if (error) return { success: false as const, error: error.message };
  await recordAdminAction({
    islem: "ilan_silindi",
    entityTip: "ilan",
    entityId: cleanIds.join(","),
    detaylar: { adet: cleanIds.length },
  });
  revalidatePath("/yonetim/ilanlar");
  return { success: true as const };
}

type ListingMediaRow = {
  id: string;
  url: string;
  sira: number;
  ilan_id: string;
};

const MEDIA_BUCKET = "ilan-medyalari";
const PUBLIC_BUCKET_SEGMENT = `/storage/v1/object/public/${MEDIA_BUCKET}/`;

async function assertAdminForMedia() {
  const admin = await requireAdminUser();
  if (!admin.ok) return { ok: false as const, error: admin.error };
  return { ok: true as const, supabase: createAdminClient() };
}

function normalizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

function extractObjectPath(publicUrl: string) {
  const idx = publicUrl.indexOf(PUBLIC_BUCKET_SEGMENT);
  if (idx === -1) return null;
  return publicUrl.slice(idx + PUBLIC_BUCKET_SEGMENT.length);
}

async function fetchListingMedia(supabase: ReturnType<typeof createAdminClient>, listingId: string) {
  const { data } = await supabase
    .from("ilan_medyalari")
    .select("id,url,sira,ilan_id")
    .eq("ilan_id", listingId)
    .order("sira", { ascending: true });
  return (data ?? []) as ListingMediaRow[];
}

export async function uploadListingMediaByAdmin(listingId: string, formData: FormData) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) return { success: false as const, error: admin.error, media: [] as ListingMediaRow[] };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) {
    const media = await fetchListingMedia(admin.supabase, listingId);
    return { success: false as const, error: "Yüklenecek dosya seçin.", media };
  }

  const { data: currentMedia } = await admin.supabase
    .from("ilan_medyalari")
    .select("sira")
    .eq("ilan_id", listingId)
    .order("sira", { ascending: false })
    .limit(1);
  let nextOrder = (currentMedia?.[0]?.sira ?? 0) + 1;

  for (const file of files) {
    const safeName = normalizeFileName(file.name || "image.jpg");
    const objectPath = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error: uploadError } = await admin.supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, file, { upsert: false, contentType: file.type || "image/jpeg" });
    if (uploadError) {
      return { success: false as const, error: `Dosya yüklenemedi: ${uploadError.message}`, media: [] as ListingMediaRow[] };
    }

    const { data: publicData } = admin.supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
    const { error: insertError } = await admin.supabase.from("ilan_medyalari").insert({
      ilan_id: listingId,
      url: publicData.publicUrl,
      tip: "resim",
      sira: nextOrder,
    });
    if (insertError) {
      return { success: false as const, error: `Medya kaydı eklenemedi: ${insertError.message}`, media: [] as ListingMediaRow[] };
    }
    nextOrder += 1;
  }

  const media = await fetchListingMedia(admin.supabase, listingId);
  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/panel/ilanlarim");
  revalidatePath("/");
  return { success: true as const, media };
}

export async function deleteListingMediaByAdmin(listingId: string, mediaId: string) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) return { success: false as const, error: admin.error, media: [] as ListingMediaRow[] };

  const { data: mediaRow } = await admin.supabase
    .from("ilan_medyalari")
    .select("id,url")
    .eq("id", mediaId)
    .eq("ilan_id", listingId)
    .maybeSingle();

  if (!mediaRow) {
    const media = await fetchListingMedia(admin.supabase, listingId);
    return { success: false as const, error: "Medya kaydı bulunamadı.", media };
  }

  const { error: deleteError } = await admin.supabase
    .from("ilan_medyalari")
    .delete()
    .eq("id", mediaId)
    .eq("ilan_id", listingId);
  if (deleteError) {
    const media = await fetchListingMedia(admin.supabase, listingId);
    return { success: false as const, error: `Silme başarısız: ${deleteError.message}`, media };
  }

  const objectPath = extractObjectPath(mediaRow.url);
  if (objectPath) {
    await admin.supabase.storage.from(MEDIA_BUCKET).remove([objectPath]);
  }

  const media = await fetchListingMedia(admin.supabase, listingId);
  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/panel/ilanlarim");
  revalidatePath("/");
  return { success: true as const, media };
}

export async function reorderListingMediaByAdmin(listingId: string, orderedIds: string[]) {
  const admin = await assertAdminForMedia();
  if (!admin.ok) return { success: false as const, error: admin.error, media: [] as ListingMediaRow[] };

  if (!orderedIds.length) {
    const media = await fetchListingMedia(admin.supabase, listingId);
    return { success: false as const, error: "Sıralama verisi boş.", media };
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      admin.supabase
        .from("ilan_medyalari")
        .update({ sira: index + 1 })
        .eq("id", id)
        .eq("ilan_id", listingId),
    ),
  );

  const media = await fetchListingMedia(admin.supabase, listingId);
  revalidatePath("/yonetim/ilanlar");
  revalidatePath("/panel/ilanlarim");
  revalidatePath("/");
  return { success: true as const, media };
}
