/**
 * Rezervasyon URL segmenti: mümkünse slug (stabil, okunur); yoksa ilan id.
 * Yanlış/placeholder UUID ile id kullanımını azaltır.
 */
export function reservationUrlSegmentFromListing(slug: string | null | undefined, id: string): string {
  const s = typeof slug === "string" ? slug.trim() : "";
  if (s.length > 0) return s;
  return id;
}

export function looksLikeUuid(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment.trim());
}

