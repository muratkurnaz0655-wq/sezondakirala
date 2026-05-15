import type { Paket } from "@/types/supabase";

/** Taslak / test paketleri — ana sayfa ve `/paketler` listesinde gösterilmez. */
export function isExcludedDraftPackage(p: Paket): boolean {
  const baslik = (p.baslik ?? "").trim().toLowerCase();
  if (baslik === "deneme") return true;
  if (baslik.startsWith("deneme ")) return true;
  const aciklama = (p.aciklama ?? "").trim().toLowerCase();
  if (aciklama === "deneme deneme deneme") return true;
  if (aciklama.includes("test verisi")) return true;
  if (aciklama.includes("test veri")) return true;
  if (aciklama.includes("test data")) return true;
  return false;
}
