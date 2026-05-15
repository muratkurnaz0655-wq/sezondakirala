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

/** Kamuya açık sitede gösterilebilir ilan veya paket */
export function isPublishedListing(row: { aktif?: boolean | null; onay_durumu?: string | null }) {
  const onay = String(row.onay_durumu ?? "")
    .trim()
    .toLowerCase();
  return Boolean(row.aktif) && onay === LISTING_ONAY_DURUMU.PUBLISHED;
}

/** Paket — kolon yokken veya eski kayıtta `onay_durumu` boşsa aktif yeterli */
export function isPublishedPackage(row: { aktif?: boolean | null; onay_durumu?: string | null }) {
  if (!row.aktif) return false;
  if (row.onay_durumu == null || row.onay_durumu === "") return true;
  return row.onay_durumu === LISTING_ONAY_DURUMU.PUBLISHED;
}

function isMissingOnayDurumuColumn(error: { message?: string } | null | undefined) {
  const msg = (error?.message ?? "").toLowerCase();
  return msg.includes("onay_durumu") && (msg.includes("column") || msg.includes("schema"));
}

export { isMissingOnayDurumuColumn };

/** Admin tablosu / rozet için onay durumu (eksik değerlerde aktif bayrağına göre) */
export function resolveListingOnayDurumu(row: {
  aktif?: boolean | null;
  onay_durumu?: string | null;
}): ListingOnayDurumu | null {
  if (isListingOnayDurumu(row.onay_durumu)) return row.onay_durumu;
  if (row.aktif) return LISTING_ONAY_DURUMU.PUBLISHED;
  return LISTING_ONAY_DURUMU.PENDING;
}
