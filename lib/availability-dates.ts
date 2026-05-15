import { dateFromYmdLocal } from "@/lib/tr-today";

/** Yerel takvim günü → YYYY-MM-DD (UTC kayması yok) */
export function ymdFromLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Dahil başlangıç ve bitiş; her gün ayrı YMD string */
export function eachDateInRangeYmd(startYmd: string, endYmd: string): string[] {
  const start = startYmd.trim();
  const end = endYmd.trim();
  if (!start || !end) return [];

  const dates: string[] = [];
  const current = dateFromYmdLocal(start);
  const endDate = dateFromYmdLocal(end);
  if (Number.isNaN(current.getTime()) || Number.isNaN(endDate.getTime())) return dates;

  const from = current <= endDate ? current : endDate;
  const to = current <= endDate ? endDate : current;

  const cursor = new Date(from);
  while (cursor <= to) {
    dates.push(ymdFromLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
