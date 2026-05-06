export const RESERVATION_STATUS_VALUES = ["beklemede", "onaylandi", "iptal"] as const;
export type ReservationStatusValue = (typeof RESERVATION_STATUS_VALUES)[number];

const RESERVATION_STATUS_ALIASES: Record<string, ReservationStatusValue> = {
  pending: "beklemede",
  approved: "onaylandi",
  rejected: "iptal",
  cancelled: "iptal",
  onay_bekliyor: "beklemede",
  odeme_bekleniyor: "beklemede",
  reddedildi: "iptal",
  beklemede: "beklemede",
  onaylandi: "onaylandi",
  iptal: "iptal",
};

export function normalizeReservationStatus(
  value: string,
): "beklemede" | "onaylandi" | "iptal" | "reddedildi" | string {
  const normalized = value.trim().toLowerCase();
  return RESERVATION_STATUS_ALIASES[normalized] ?? "beklemede";
}

export const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  beklemede: { label: "Beklemede", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  onaylandi: { label: "Onaylandı", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  iptal: { label: "İptal Edildi", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
};

export const DEFAULT_STATUS_STYLE = {
  label: "Bilinmiyor",
  color: "text-slate-600",
  bg: "bg-slate-100 border-slate-200",
};
