/** Supabase `ilanlar(...)` join sonucu: ilan silindiyse veya ilan_id boşsa join gelmez. */
export function reservationHasJoinedListing(rez: {
  ilan_id?: string | null;
  ilanlar?: unknown;
}): boolean {
  if (!rez.ilan_id) return false;
  const il = rez.ilanlar;
  if (il == null) return false;
  if (Array.isArray(il)) return il.length > 0 && il[0] != null;
  return typeof il === "object";
}
