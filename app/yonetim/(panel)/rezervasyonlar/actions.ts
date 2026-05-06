"use server";

import { revalidatePath } from "next/cache";
import { updateReservationByAdmin } from "@/app/actions/admin";
import { normalizeReservationStatus } from "@/lib/reservation-status";

export async function updateReservationStatus(
  id: string,
  status: string,
) {
  const normalizedStatus = normalizeReservationStatus(status);
  const formData = new FormData();
  formData.set("id", id);
  formData.set("durum", normalizedStatus);
  const result = await updateReservationByAdmin(formData);
  if (!result?.success) {
    return { success: false as const, error: result?.error ?? "Rezervasyon durumu güncellenemedi." };
  }
  revalidatePath("/yonetim/rezervasyonlar");
  return { success: true as const, status: normalizedStatus };
}
