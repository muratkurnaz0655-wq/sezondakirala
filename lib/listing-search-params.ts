/** URL ?giris= / ?cikis= — YYYY-MM-DD doğrulama */
export function parseListingDateParam(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}

export function parseGuestParam(value: string | null | undefined, fallback: number) {
  if (!value?.trim()) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
