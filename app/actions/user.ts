"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type CreateUserProfileInput = {
  id: string;
  email: string;
  adSoyad: string;
  telefon: string;
  rol: "ziyaretci" | "ilan_sahibi";
};

export async function createUserProfile(input: CreateUserProfileInput) {
  const admin = createAdminClient();
  const { error } = await admin.from("kullanicilar").upsert({
    id: input.id,
    email: input.email,
    ad_soyad: input.adSoyad,
    telefon: input.telefon,
    rol: input.rol,
  });

  if (error) {
    return { success: false, error: "Kullanıcı profili kaydedilemedi." };
  }

  return { success: true };
}
