"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/guards";

export type AyarlarKayitSonuc = { basarili: boolean; mesaj: string };

export async function ayarlariKaydet(formData: FormData): Promise<AyarlarKayitSonuc> {
  const admin = await requireAdminUser();
  if (!admin.ok) return { basarili: false, mesaj: admin.error };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return { basarili: false, mesaj: "Supabase ortam değişkenleri eksik." };
  }

  const supabase = createClient(url, serviceKey);

  const komisyonPct = Number(formData.get("komisyon_orani"));
  const komisyon_orani = Number.isFinite(komisyonPct) ? komisyonPct / 100 : 0.1;

  const yeniAyarlar = {
    tursab_no: String(formData.get("tursab_no") ?? ""),
    whatsapp_number: String(formData.get("whatsapp_number") ?? ""),
    komisyon_orani,
    site_adi: String(formData.get("site_adi") ?? ""),
    site_slogan: String(formData.get("site_slogan") ?? ""),
    iletisim_email: String(formData.get("iletisim_email") ?? ""),
    iletisim_telefon: String(formData.get("iletisim_telefon") ?? ""),
  };

  const { data: mevcut, error: selectError } = await supabase
    .from("ayarlar")
    .select("id")
    .order("olusturulma_tarihi", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    return { basarili: false, mesaj: selectError.message };
  }

  let islemHata;
  if (mevcut?.id) {
    const { error } = await supabase.from("ayarlar").update(yeniAyarlar).eq("id", mevcut.id);
    islemHata = error;
  } else {
    const { error } = await supabase.from("ayarlar").insert(yeniAyarlar);
    islemHata = error;
  }

  if (islemHata) {
    return { basarili: false, mesaj: "Hata: " + islemHata.message };
  }

  revalidatePath("/yonetim/ayarlar");
  revalidatePath("/");
  revalidatePath("/", "layout");
  return { basarili: true, mesaj: "Ayarlar başarıyla kaydedildi!" };
}
