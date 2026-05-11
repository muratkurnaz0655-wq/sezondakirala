"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubmitListingReviewResult = { ok: true } | { ok: false; error: string };

export async function submitListingReview(input: {
  ilanId: string;
  rezervasyonId: string;
  puan: number;
  yorum: string;
  tip: "villa" | "tekne";
  slug: string;
}): Promise<SubmitListingReviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const text = input.yorum.trim();
  if (text.length < 20) return { ok: false, error: "Yorum en az 20 karakter olmalıdır." };
  if (text.length > 500) return { ok: false, error: "Yorum en fazla 500 karakter olabilir." };
  if (!Number.isFinite(input.puan) || input.puan < 1 || input.puan > 5) {
    return { ok: false, error: "Lütfen 1 ile 5 arasında bir puan seçin." };
  }

  const { data: existing } = await supabase
    .from("yorumlar")
    .select("id")
    .eq("ilan_id", input.ilanId)
    .eq("kullanici_id", user.id)
    .maybeSingle();
  if (existing) return { ok: false, error: "Bu ilan için zaten yorum yaptınız." };

  const { data: rez, error: rezErr } = await supabase
    .from("rezervasyonlar")
    .select("id")
    .eq("id", input.rezervasyonId)
    .eq("ilan_id", input.ilanId)
    .eq("kullanici_id", user.id)
    .in("durum", ["approved", "onaylandi"])
    .maybeSingle();
  if (rezErr || !rez) return { ok: false, error: "Bu ilan için onaylı rezervasyonunuz bulunmuyor." };

  const { error } = await supabase.from("yorumlar").insert({
    rezervasyon_id: input.rezervasyonId,
    kullanici_id: user.id,
    ilan_id: input.ilanId,
    puan: Math.round(input.puan),
    yorum: text,
  });
  if (error) return { ok: false, error: error.message };

  const path = input.tip === "villa" ? `/konaklama/${input.slug}` : `/tekneler/${input.slug}`;
  revalidatePath(path);
  return { ok: true };
}
