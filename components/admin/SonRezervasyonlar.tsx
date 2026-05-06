import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";

export async function SonRezervasyonlar() {
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("rezervasyonlar")
    .select("id,durum,giris_tarihi,cikis_tarihi,toplam_fiyat,kullanici_id,ilan_id,olusturulma_tarihi")
    .order("olusturulma_tarihi", { ascending: false })
    .limit(6);

  if (!rows?.length) {
    return <p className="text-sm text-slate-500">Henüz rezervasyon yok.</p>;
  }

  const ilanIds = [...new Set(rows.map((r) => r.ilan_id).filter(Boolean))] as string[];
  const userIds = [...new Set(rows.map((r) => r.kullanici_id).filter(Boolean))] as string[];

  const [{ data: ilanlar }, { data: kullanicilar }] = await Promise.all([
    ilanIds.length ? supabase.from("ilanlar").select("id,baslik").in("id", ilanIds) : { data: [] },
    userIds.length ? supabase.from("kullanicilar").select("id,ad_soyad,email").in("id", userIds) : { data: [] },
  ]);

  const ilanMap = new Map((ilanlar ?? []).map((i) => [i.id, i.baslik ?? "İlan"]));
  const userMap = new Map(
    (kullanicilar ?? []).map((u) => [u.id, u.ad_soyad ?? u.email ?? "Kullanıcı"]),
  );

  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between rounded-lg border-b border-slate-100 px-2 py-3 text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50/50"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-slate-800">{ilanMap.get(r.ilan_id) ?? "İlan"}</div>
            <div className="text-xs text-slate-500">
              {userMap.get(r.kullanici_id) ?? "-"} · {String(r.giris_tarihi).slice(0, 10)} →{" "}
              {String(r.cikis_tarihi).slice(0, 10)}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                r.durum === "onaylandi"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : r.durum === "beklemede"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {r.durum === "onaylandi" ? "Onaylandı" : r.durum === "beklemede" ? "Beklemede" : "İptal"}
            </span>
            <span className="text-sm font-semibold text-slate-800">{formatCurrency(Number(r.toplam_fiyat ?? 0))}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
