"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/constants";

function safeStorageFileName(name: string) {
  const trimmed = name.trim().slice(0, 180);
  const base = trimmed.replace(/[^\w.\-]+/g, "_");
  return base || "upload";
}

function extractObjectPath(publicUrl: string) {
  const bucketSegment = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = publicUrl.indexOf(bucketSegment);
  if (idx === -1) return null;
  return publicUrl.slice(idx + bucketSegment.length);
}

type PackageMediaRow = {
  id: string;
  paket_id: string;
  url: string;
  tip: "kapak" | "detay";
  sira: number;
};

async function fetchPackageMedia(packageId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("paket_medyalari")
    .select("id,paket_id,url,tip,sira")
    .eq("paket_id", packageId)
    .order("tip", { ascending: true })
    .order("sira", { ascending: true });
  return (data ?? []) as PackageMediaRow[];
}

export async function updatePackage(id: string, formData: FormData) {
  const admin = await requireAdminUser();
  if (!admin.ok) return { success: false as const, error: admin.error };

  const supabase = createAdminClient();
  const gorselInput = formData.get("gorsel_url");
  const gorselText = typeof gorselInput === "string" ? gorselInput.trim() : "";
  const fileInput = formData.get("cover_file") ?? formData.get("gorsel_file");
  let gorselUrl: string | null | undefined = gorselText || null;

  const hasUploadableFile =
    typeof fileInput === "object" &&
    fileInput !== null &&
    "size" in fileInput &&
    typeof fileInput.size === "number" &&
    fileInput.size > 0 &&
    "name" in fileInput &&
    typeof fileInput.name === "string";

  if (hasUploadableFile) {
    const uploadFile = fileInput as { size: number; name: string; type?: string };
    const path = `paketler/${id}/${Date.now()}-${safeStorageFileName(uploadFile.name)}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, fileInput as File, {
      upsert: true,
      contentType: uploadFile.type || "image/jpeg",
    });
    if (uploadError) return { success: false as const, error: "Paket görseli yüklenemedi." };
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    gorselUrl = publicUrl;

    await supabase.from("paket_medyalari").delete().eq("paket_id", id).eq("tip", "kapak");
    await supabase.from("paket_medyalari").insert({
      paket_id: id,
      url: publicUrl,
      tip: "kapak",
      sira: 1,
    });
  }

  const detailFiles = formData
    .getAll("detay_files")
    .filter((file): file is File => file instanceof File && file.size > 0);
  if (detailFiles.length) {
    const { data: lastDetail } = await supabase
      .from("paket_medyalari")
      .select("sira")
      .eq("paket_id", id)
      .eq("tip", "detay")
      .order("sira", { ascending: false })
      .limit(1);
    let detailOrder = (lastDetail?.[0]?.sira ?? 0) + 1;
    for (const detailFile of detailFiles) {
      const detailPath = `paketler/${id}/detail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeStorageFileName(detailFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(detailPath, detailFile, {
          upsert: true,
          contentType: detailFile.type || "image/jpeg",
        });
      if (uploadError) continue;
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(detailPath);
      await supabase.from("paket_medyalari").insert({
        paket_id: id,
        url: publicUrl,
        tip: "detay",
        sira: detailOrder,
      });
      detailOrder += 1;
    }
  }

  const basePayload = {
    baslik: String(formData.get("name") ?? formData.get("baslik") ?? ""),
    kategori: String(formData.get("kategori") ?? "macera"),
    sure_gun: Number(formData.get("sure_gun") ?? 1),
    kapasite: Number(formData.get("kapasite") ?? 1),
    fiyat: Number(formData.get("price") ?? formData.get("fiyat") ?? 0),
    aciklama: String(formData.get("description") ?? formData.get("aciklama") ?? ""),
  };

  const { error: updateWithImageError } = await supabase
    .from("paketler")
    .update({
      ...basePayload,
      gorsel_url: gorselUrl,
    })
    .eq("id", id);

  if (updateWithImageError) {
    const missingColumn =
      updateWithImageError.message.includes("'gorsel_url'") &&
      updateWithImageError.message.includes("schema cache");
    if (!missingColumn) {
      return { success: false as const, error: updateWithImageError.message };
    }

    // Eski şemada `gorsel_url` kolonu yoksa paket kaydını yine de güncelle.
    const { error: updateFallbackError } = await supabase
      .from("paketler")
      .update(basePayload)
      .eq("id", id);
    if (updateFallbackError) {
      return { success: false as const, error: updateFallbackError.message };
    }
  }

  revalidatePath("/yonetim/paketler");
  revalidatePath("/paketler");
  revalidatePath(`/paketler/${id}`);
  return { success: true as const };
}

export async function deletePackageMedia(packageId: string, mediaId: string) {
  const admin = await requireAdminUser();
  if (!admin.ok) return { success: false as const, error: admin.error, media: [] as PackageMediaRow[] };

  const supabase = createAdminClient();
  const { data: mediaRow } = await supabase
    .from("paket_medyalari")
    .select("id,url,tip")
    .eq("id", mediaId)
    .eq("paket_id", packageId)
    .maybeSingle();
  if (!mediaRow) {
    return { success: false as const, error: "Medya bulunamadı.", media: await fetchPackageMedia(packageId) };
  }

  const { error: deleteError } = await supabase
    .from("paket_medyalari")
    .delete()
    .eq("id", mediaId)
    .eq("paket_id", packageId);
  if (deleteError) {
    return {
      success: false as const,
      error: "Medya silinemedi.",
      media: await fetchPackageMedia(packageId),
    };
  }

  if (mediaRow.tip === "kapak") {
    await supabase.from("paketler").update({ gorsel_url: null }).eq("id", packageId);
  }

  const objectPath = extractObjectPath(mediaRow.url);
  if (objectPath) {
    await supabase.storage.from(STORAGE_BUCKET).remove([objectPath]);
  }

  revalidatePath("/yonetim/paketler");
  revalidatePath("/paketler");
  revalidatePath(`/paketler/${packageId}`);
  return { success: true as const, media: await fetchPackageMedia(packageId) };
}

export async function reorderPackageDetailMedia(packageId: string, orderedIds: string[]) {
  const admin = await requireAdminUser();
  if (!admin.ok) return { success: false as const, error: admin.error, media: [] as PackageMediaRow[] };
  if (!orderedIds.length) {
    return { success: false as const, error: "Sıralama boş.", media: await fetchPackageMedia(packageId) };
  }

  const supabase = createAdminClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("paket_medyalari")
        .update({ sira: index + 1 })
        .eq("id", id)
        .eq("paket_id", packageId)
        .eq("tip", "detay"),
    ),
  );

  revalidatePath("/yonetim/paketler");
  revalidatePath("/paketler");
  revalidatePath(`/paketler/${packageId}`);
  return { success: true as const, media: await fetchPackageMedia(packageId) };
}

export async function setPackageCoverMedia(packageId: string, mediaId: string) {
  const admin = await requireAdminUser();
  if (!admin.ok) return { success: false as const, error: admin.error, media: [] as PackageMediaRow[] };

  const supabase = createAdminClient();
  const { data: detailRow } = await supabase
    .from("paket_medyalari")
    .select("id,url")
    .eq("id", mediaId)
    .eq("paket_id", packageId)
    .eq("tip", "detay")
    .maybeSingle();
  if (!detailRow) {
    return { success: false as const, error: "Detay görseli bulunamadı.", media: await fetchPackageMedia(packageId) };
  }

  await supabase.from("paket_medyalari").delete().eq("paket_id", packageId).eq("tip", "kapak");
  await supabase.from("paket_medyalari").insert({
    paket_id: packageId,
    url: detailRow.url,
    tip: "kapak",
    sira: 1,
  });
  await supabase.from("paketler").update({ gorsel_url: detailRow.url }).eq("id", packageId);

  revalidatePath("/yonetim/paketler");
  revalidatePath("/paketler");
  revalidatePath(`/paketler/${packageId}`);
  return { success: true as const, media: await fetchPackageMedia(packageId) };
}
