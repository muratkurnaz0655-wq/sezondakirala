"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelReservation(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("rezervasyonlar")
    .update({ durum: "cancelled" })
    .eq("id", id)
    .eq("kullanici_id", user.id)
    .eq("durum", "pending");

  revalidatePath("/panel/rezervasyonlar");
  revalidatePath(`/panel/rezervasyonlar/${id}`);
}
