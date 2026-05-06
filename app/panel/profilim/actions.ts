"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/panel/profilim");

  const adSoyad = String(formData.get("ad_soyad") ?? "").trim();
  const newPassword = String(formData.get("new_password") ?? "").trim();

  if (adSoyad.length >= 3) {
    await supabase.from("kullanicilar").upsert({ id: user.id, ad_soyad: adSoyad }, { onConflict: "id" });
  }

  if (newPassword.length >= 6) {
    await supabase.auth.updateUser({ password: newPassword });
  }

  revalidatePath("/panel/profilim");
  redirect("/panel/profilim?ok=1");
}
