"use server";

import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/constants";
import { storageUploadUserMessage } from "@/lib/storage-upload-messages";

export async function updateProfile(formData: FormData) {
  const adSoyad = String(formData.get("ad_soyad") ?? "");
  const telefon = String(formData.get("telefon") ?? "");
  const avatarFile = formData.get("avatar") as File | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Oturum bulunamadi." };

  let avatarUrl: string | null = null;
  if (avatarFile && avatarFile.size > 0) {
    const path = `${user.id}/${Date.now()}-${avatarFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, avatarFile, { upsert: true });

    if (uploadError) {
      return { success: false, error: storageUploadUserMessage(uploadError.message) };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    avatarUrl = publicUrl;
  }

  const payload = {
    id: user.id,
    email: user.email,
    ad_soyad: adSoyad,
    telefon,
    avatar_url: avatarUrl,
  };

  const { data: updated, error: updateError } = await supabase
    .from("kullanicilar")
    .update(payload)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (updateError) return { success: false, error: "Profil guncellenemedi." };

  if (!updated) {
    const { error: insertError } = await supabase.from("kullanicilar").insert(payload);
    if (insertError) return { success: false, error: "Profil olusturulamadi." };
  }

  return { success: true };
}
