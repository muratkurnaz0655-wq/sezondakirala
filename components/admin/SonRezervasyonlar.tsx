import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";

function formatDate(value: unknown) {
  const date = new Date(`${String(value ?? "").slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function adminRscErrorBox(title: string, detail: string) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800">
      <p className="font-semibold">{title}</p>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-red-900">
        {detail}
      </pre>
    </div>
  );
}

export async function SonRezervasyonlar() {
  try {
    const supabase = createAdminClient();
    const { data: rows, error } = await supabase
      .from("dashboard_son_rezervasyonlar")
      .select("*")
      .order("olusturulma_tarihi", { ascending: false })
      .limit(6);

    if (error) {
      return adminRscErrorBox(
        "Son rezervasyonlar yüklenemedi (Supabase)",
        `${error.message}\nKod: ${error.code ?? "-"}\n\nİpucu: Supabase’de "dashboard_son_rezervasyonlar" görünümü (view) yoksa veya adı farklıysa bu hata oluşur.`,
      );
    }

    if (!rows?.length) {
      return <p className="text-sm text-slate-500">Henüz rezervasyon yok.</p>;
    }

    return (
      <ul className="space-y-1">
        {rows.map((r) => {
          const durumStr = String(r.durum ?? "");
          const status = STATUS_MAP[normalizeReservationStatus(durumStr)] ?? STATUS_MAP.pending;
          return (
            <li
              key={String(r.id)}
              className="flex items-center justify-between rounded-lg border-b border-slate-100 px-2 py-3 text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50/50"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-slate-800">
                  {String(r.ilan_baslik ?? r.paket_baslik ?? r.ilan_adi ?? "İlan")}
                </div>
                <div className="text-xs text-slate-500">
                  {String(r.kullanici_adi ?? r.kullanici_ad_soyad ?? "-")} · {formatDate(r.giris_tarihi)} →{" "}
                  {formatDate(r.cikis_tarihi)}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color} ${status.bg}`}
                >
                  {status.label}
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {formatCurrency(Number(r.toplam_fiyat ?? 0))}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack ?? ""}` : String(e);
    return adminRscErrorBox("Son rezervasyonlar bileşeni çöktü", msg);
  }
}
