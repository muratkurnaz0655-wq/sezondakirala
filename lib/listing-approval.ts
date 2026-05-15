export const LISTING_ONAY_DURUMU = {
  PENDING: "onay_bekliyor",
  PUBLISHED: "yayinda",
  REJECTED: "reddedildi",
} as const;

export type ListingOnayDurumu = (typeof LISTING_ONAY_DURUMU)[keyof typeof LISTING_ONAY_DURUMU];

export function isListingOnayDurumu(value: unknown): value is ListingOnayDurumu {
  return (
    value === LISTING_ONAY_DURUMU.PENDING ||
    value === LISTING_ONAY_DURUMU.PUBLISHED ||
    value === LISTING_ONAY_DURUMU.REJECTED
  );
}

/** Kamuya açık sitede gösterilebilir ilan */
export function isPublishedListing(row: { aktif?: boolean | null; onay_durumu?: string | null }) {
  return Boolean(row.aktif) && row.onay_durumu === LISTING_ONAY_DURUMU.PUBLISHED;
}

/** Admin tablosu / rozet için onay durumu (eksik değerlerde aktif bayrağına göre) */
export function resolveListingOnayDurumu(row: {
  aktif?: boolean | null;
  onay_durumu?: string | null;
}): ListingOnayDurumu | null {
  if (isListingOnayDurumu(row.onay_durumu)) return row.onay_durumu;
  if (row.aktif) return LISTING_ONAY_DURUMU.PUBLISHED;
  return LISTING_ONAY_DURUMU.PENDING;
}
