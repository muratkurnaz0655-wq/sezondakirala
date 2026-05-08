import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";

function formatDate(value: unknown) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function SonRezervasyonlar() {
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("dashboard_son_rezervasyonlar")
    .select("*")
    .order("olusturulma_tarihi", { ascending: false })
    .limit(6);

  if (!rows?.length) {
    return <p className="text-sm text-slate-500">Henüz rezervasyon yok.</p>;
  }

  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const status = STATUS_MAP[normalizeReservationStatus(String(r.durum))] ?? STATUS_MAP.pending;
        return (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg border-b border-slate-100 px-2 py-3 text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50/50"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-slate-800">{String(r.ilan_baslik ?? r.paket_baslik ?? r.ilan_adi ?? "İlan")}</div>
              <div className="text-xs text-slate-500">
                {String(r.kullanici_adi ?? r.kullanici_ad_soyad ?? "-")} · {formatDate(r.giris_tarihi)} → {formatDate(r.cikis_tarihi)}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color} ${status.bg}`}>
                {status.label}
              </span>
              <span className="text-sm font-semibold text-slate-800">{formatCurrency(Number(r.toplam_fiyat ?? 0))}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
