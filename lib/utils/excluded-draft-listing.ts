/** Taslak / test ilanları — vitrin ve katalog listelerinde gösterilmez. */
export function isExcludedDraftListing(row: { baslik: string; aciklama?: string | null }): boolean {
  const baslik = (row.baslik ?? "").trim().toLowerCase();
  if (baslik === "deneme") return true;
  if (baslik.startsWith("deneme ")) return true;
  const aciklama = (row.aciklama ?? "").trim().toLowerCase();
  if (aciklama === "deneme deneme deneme") return true;
  if (aciklama.includes("test verisi")) return true;
  if (aciklama.includes("test veri")) return true;
  if (aciklama.includes("test data")) return true;
  return false;
}
