/** Türkçe uzun tarih: 15 Mayıs 2026 */
export function formatTurkishDate(date: Date): string {
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Tek gün veya aralık metni */
export function formatTurkishDateRange(from: Date, to?: Date): string {
  const start = formatTurkishDate(from);
  if (!to || from.getTime() === to.getTime()) return start;
  return `${start} — ${formatTurkishDate(to)}`;
}
