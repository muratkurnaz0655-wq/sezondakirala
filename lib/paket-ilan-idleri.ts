/** Supabase `ilan_idleri` bazen dizi, bazen JSON string dönebiliyor */
export function normalizePaketListingIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      /* düz virgüllü liste */
    }
    return t.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  }
  if (raw && typeof raw === "object" && "length" in (raw as object)) {
    return Array.from(raw as unknown[]).map(String).filter(Boolean);
  }
  return [];
}
