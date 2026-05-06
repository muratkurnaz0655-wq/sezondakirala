/** Europe/Istanbul takvim günü YYYY-MM-DD */
export function istanbulDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** YYYY-MM-DD → yerel gece yarısı (UTC `new Date('yyyy-mm-dd')` kaymasını önler) */
export function dateFromYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return new Date(NaN);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
