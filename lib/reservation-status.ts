export const RESERVATION_STATUS_VALUES = ["pending", "approved", "cancelled"] as const;
export type ReservationStatusValue = (typeof RESERVATION_STATUS_VALUES)[number];

const RESERVATION_STATUS_ALIASES: Record<string, ReservationStatusValue> = {
  pending: "pending",
  approved: "approved",
  rejected: "cancelled",
  cancelled: "cancelled",
  onay_bekliyor: "pending",
  odeme_bekleniyor: "pending",
  reddedildi: "cancelled",
  beklemede: "pending",
  onaylandi: "approved",
  iptal: "cancelled",
};

export function normalizeReservationStatus(
  value: string,
): ReservationStatusValue {
  const normalized = value.trim().toLowerCase();
  return RESERVATION_STATUS_ALIASES[normalized] ?? "pending";
}

export const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Beklemede", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  approved: { label: "Onaylandı", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled: { label: "İptal", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

export const DEFAULT_STATUS_STYLE = {
  label: "Bilinmiyor",
  color: "text-slate-600",
  bg: "bg-slate-100 border-slate-200",
};
