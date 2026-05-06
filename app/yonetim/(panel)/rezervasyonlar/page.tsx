import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { ReservationStatusSelect } from "./ReservationStatusSelect";
import { ReservationDetailButton } from "./ReservationDetailButton";
import { normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";

type AdminReservationsProps = {
  searchParams: Promise<{
    durum?: string;
    tarih?: string;
    tip?: string;
    q?: string;
    baslangic?: string;
    bitis?: string;
    siralama?: string;
  }>;
};

function toQueryString(
  params: Awaited<AdminReservationsProps["searchParams"]>,
  overrides: Partial<Awaited<AdminReservationsProps["searchParams"]>>,
) {
  const next = { ...params, ...overrides };
  const qs = new URLSearchParams();
  Object.entries(next).forEach(([key, value]) => {
    if (value && String(value).trim() !== "") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export default async function AdminReservationsPage({ searchParams }: AdminReservationsProps) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const sortAsc = params.siralama === "eski";

  let query = supabase
    .from("rezervasyonlar")
    .select("*")
    .order("olusturulma_tarihi", { ascending: sortAsc });

  if (params.durum) query = query.eq("durum", normalizeReservationStatus(params.durum));
  if (params.tarih) query = query.gte("giris_tarihi", params.tarih);
  if (params.baslangic) query = query.gte("giris_tarihi", params.baslangic);
  if (params.bitis) query = query.lte("cikis_tarihi", params.bitis);

  const [{ data: reservations }, { data: users }, { data: listings }, { data: packages }] = await Promise.all([
    query,
    supabase.from("kullanicilar").select("id,ad_soyad,email,telefon"),
    supabase.from("ilanlar").select("id,baslik,tip,konum"),
    supabase.from("paketler").select("id,baslik,kategori"),
  ]);

  const listingMap = new Map(
    (listings ?? []).map((item) => [
      item.id,
      { baslik: item.baslik, tip: item.tip, konum: item.konum ?? "-" },
    ]),
  );
  const userMap = new Map((users ?? []).map((item) => [item.id, item.ad_soyad ?? item.email ?? "-"]));
  const userDetailMap = new Map(
    (users ?? []).map((item) => [
      item.id,
      {
        adSoyad: item.ad_soyad ?? "-",
        email: item.email ?? "-",
        telefon: item.telefon ?? "-",
      },
    ]),
  );
  const packageMap = new Map(
    (packages ?? []).map((item) => [item.id, { baslik: item.baslik, kategori: item.kategori ?? "-" }]),
  );
  const searchTerm = params.q?.trim().toLowerCase() ?? "";
  const filteredReservations = (reservations ?? []).filter((row) => {
    const typeMatch = params.tip ? listingMap.get(row.ilan_id)?.tip === params.tip : true;
    if (!typeMatch) return false;
    if (!searchTerm) return true;

    const user = userDetailMap.get(row.kullanici_id);
    const listing = listingMap.get(row.ilan_id);
    const packageTitle = row.paket_id ? packageMap.get(row.paket_id)?.baslik : null;
    const haystack = [
      row.referans_no,
      row.id,
      row.kullanici_id,
      user?.adSoyad,
      user?.email,
      user?.telefon,
      listing?.baslik,
      listing?.konum,
      packageTitle,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm);
  });
  const totalReservations = filteredReservations.length;
  const pendingCount = filteredReservations.filter((item) => normalizeReservationStatus(String(item.durum)) === "beklemede").length;
  const approvedCount = filteredReservations.filter((item) => normalizeReservationStatus(String(item.durum)) === "onaylandi").length;
  const canceledCount = filteredReservations.filter((item) => normalizeReservationStatus(String(item.durum)) === "iptal").length;
  const filteredRevenue = filteredReservations.reduce((acc, item) => acc + Number(item.toplam_fiyat ?? 0), 0);
  const sortToggleQuery = toQueryString(params, { siralama: sortAsc ? "yeni" : "eski" });
  const quickFilterLinks = [
    { label: "Bugün Oluşan", query: toQueryString(params, { tarih: new Date().toISOString().slice(0, 10) }) },
    { label: "Beklemede", query: toQueryString(params, { durum: "beklemede" }) },
    { label: "Onaylananlar", query: toQueryString(params, { durum: "onaylandi" }) },
    { label: "Paket Rezervasyonları", query: toQueryString(params, { q: "paket" }) },
  ];

  return (
    <AdminPageLayout
      title="Rezervasyonlar"
      description="Rezervasyonları operasyonel olarak takip edin, filtreleyin ve durum güncellemelerini yönetin."
    >
      <AdminStatsRow
        items={[
          { label: "Toplam Rezervasyon", value: totalReservations, tone: "default" },
          { label: "Beklemede", value: pendingCount, tone: "warning" },
          { label: "Onaylandı", value: approvedCount, tone: "success" },
          { label: "İptal", value: canceledCount, tone: "danger" },
          { label: "Filtrelenmiş Ciro", value: formatCurrency(filteredRevenue), tone: "info" },
        ]}
      />

      <AdminFilterBar className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Arama</label>
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Referans no, ad soyad, e-posta..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Durum</label>
          <select name="durum" defaultValue={params.durum ?? ""} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">Tüm durumlar</option>
            <option value="beklemede">Beklemede</option>
            <option value="onaylandi">Onaylandi</option>
            <option value="iptal">Iptal</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tek tarih</label>
          <input
            name="tarih"
            type="date"
            defaultValue={params.tarih ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Giriş başlangıç</label>
          <input
            name="baslangic"
            type="date"
            defaultValue={params.baslangic ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Çıkış bitiş</label>
          <input
            name="bitis"
            type="date"
            defaultValue={params.bitis ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tür</label>
          <select name="tip" defaultValue={params.tip ?? ""} className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">Tüm türler</option>
            <option value="villa">Villa</option>
            <option value="tekne">Tekne</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sıralama</label>
          <select
            name="siralama"
            defaultValue={params.siralama ?? "yeni"}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="yeni">Oluşturulma (Yeni → Eski)</option>
            <option value="eski">Oluşturulma (Eski → Yeni)</option>
          </select>
        </div>
        <div className="xl:col-span-6 flex flex-wrap gap-2">
          <button type="submit" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98]">
            Filtrele
          </button>
          <a
            href="/yonetim/rezervasyonlar"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
          >
            Filtreleri temizle
          </a>
        </div>
      </AdminFilterBar>
      <div className="flex flex-wrap gap-2">
        {quickFilterLinks.map((item) => (
          <Link
            key={item.label}
            href={item.query ? `/yonetim/rezervasyonlar?${item.query}` : "/yonetim/rezervasyonlar"}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
          >
            {item.label}
          </Link>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        {totalReservations} rezervasyon listeleniyor.
      </p>

      <div className="block space-y-3 lg:hidden">
        {filteredReservations.map((row) => (
          <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">{row.referans_no ?? row.id}</p>
            <p className="mt-1 text-xs text-slate-500">
              {format(new Date(`${row.giris_tarihi}T00:00:00`), "dd MMM", { locale: tr })} - {format(new Date(`${row.cikis_tarihi}T00:00:00`), "dd MMM yyyy", { locale: tr })}
            </p>
            <p className="mt-1 text-xs text-slate-600">{userMap.get(row.kullanici_id) ?? "-"}</p>
            <p className="mt-2 text-sm font-semibold text-[#0e9aa7]">{formatCurrency(row.toplam_fiyat)}</p>
            <div className="mt-3 flex items-center gap-2">
              <ReservationStatusSelect reservationId={row.id} initialStatus={normalizeReservationStatus(String(row.durum))} />
              <ReservationDetailButton reservation={row as Record<string, unknown>} />
            </div>
          </article>
        ))}
      </div>
      <div className="hidden w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tarih
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <a
                    href={sortToggleQuery ? `/yonetim/rezervasyonlar?${sortToggleQuery}` : "/yonetim/rezervasyonlar"}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    Oluşturulma {sortAsc ? "↑" : "↓"}
                  </a>
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Ref No
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Kullanıcı
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  İlan / Paket
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Misafir
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tutar
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Durum
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="whitespace-nowrap border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                    <p className="text-sm text-slate-700">
                      {format(new Date(`${row.giris_tarihi}T00:00:00`), "dd MMM", { locale: tr })} →{" "}
                      {format(new Date(`${row.cikis_tarihi}T00:00:00`), "dd MMM yyyy", { locale: tr })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.max(
                        0,
                        Math.ceil(
                          (new Date(`${row.cikis_tarihi}T00:00:00`).getTime() -
                            new Date(`${row.giris_tarihi}T00:00:00`).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ),
                      )}{" "}
                      gece
                    </p>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                    {row.olusturulma_tarihi
                      ? format(new Date(String(row.olusturulma_tarihi)), "dd MMM yyyy HH:mm", { locale: tr })
                      : "-"}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 font-mono text-xs text-slate-500">{row.referans_no ? `${row.referans_no.slice(0, 8)}...` : "-"}</td>
                  <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                    <Link
                      href={`/yonetim/kullanicilar?q=${encodeURIComponent(userMap.get(row.kullanici_id) ?? row.kullanici_id)}`}
                      className="font-medium text-sky-700 hover:underline"
                    >
                      {userMap.get(row.kullanici_id) ?? "-"}
                    </Link>
                    <p className="text-xs text-slate-500">{userDetailMap.get(row.kullanici_id)?.email ?? "-"}</p>
                    <p className="text-xs text-slate-400">{userDetailMap.get(row.kullanici_id)?.telefon ?? "-"}</p>
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                    {row.paket_id
                      ? (
                        <div>
                          <Link
                            href={`/yonetim/paketler/${row.paket_id}/takvim`}
                            className="font-medium text-sky-700 hover:underline"
                          >
                            {packageMap.get(row.paket_id)?.baslik ?? "Paket rezervasyonu"}
                          </Link>
                          <p className="text-xs text-slate-500">Kategori: {packageMap.get(row.paket_id)?.kategori ?? "-"}</p>
                        </div>
                      )
                      : (
                        <div>
                          <Link
                            href={`/yonetim/ilanlar/${row.ilan_id}/takvim`}
                            className="font-medium text-sky-700 hover:underline"
                          >
                            {listingMap.get(row.ilan_id)?.baslik ?? "-"}
                          </Link>
                          <p className="text-xs text-slate-500">{listingMap.get(row.ilan_id)?.konum ?? "-"}</p>
                        </div>
                      )}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">{row.misafir_sayisi}</td>
                  <td className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-800">{formatCurrency(row.toplam_fiyat)}</td>
                  <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                    {(() => {
                      const normalized = normalizeReservationStatus(String(row.durum));
                      const status = STATUS_MAP[normalized];
                      return (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color} ${status.bg}`}
                        >
                          {status.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <ReservationStatusSelect
                        reservationId={row.id}
                        initialStatus={normalizeReservationStatus(String(row.durum))}
                      />
                      <ReservationDetailButton reservation={row as Record<string, unknown>} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageLayout>
  );
}
