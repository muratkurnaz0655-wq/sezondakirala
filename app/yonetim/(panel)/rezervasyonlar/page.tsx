import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminFormField, AdminInput, AdminSelect } from "@/components/admin/AdminFormControls";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminMobileCard, AdminMobileCardList } from "@/components/admin/AdminMobileCardList";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/AdminDataTable";
import { ReservationStatusSelect } from "./ReservationStatusSelect";
import { ReservationDetailButton } from "./ReservationDetailButton";
import { normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";
import { ReservationExportButton } from "./ReservationExportButton";
import { ReservationsCalendarView } from "./ReservationsCalendarView";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

type AdminReservationsProps = {
  searchParams: Promise<{
    durum?: string;
    tarih?: string;
    tip?: string;
    q?: string;
    baslangic?: string;
    bitis?: string;
    siralama?: string;
    gorunum?: string;
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
  const view = params.gorunum === "takvim" ? "takvim" : "liste";

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
  const pendingCount = filteredReservations.filter((item) => normalizeReservationStatus(String(item.durum)) === "pending").length;
  const approvedCount = filteredReservations.filter((item) => normalizeReservationStatus(String(item.durum)) === "approved").length;
  const canceledCount = filteredReservations.filter((item) => normalizeReservationStatus(String(item.durum)) === "cancelled").length;
  const filteredRevenue = filteredReservations.reduce((acc, item) => acc + Number(item.toplam_fiyat ?? 0), 0);
  const sortToggleQuery = toQueryString(params, { siralama: sortAsc ? "yeni" : "eski" });
  const exportRows = filteredReservations.map((row) => {
    const user = userDetailMap.get(row.kullanici_id);
    const listingName = row.paket_id ? packageMap.get(row.paket_id)?.baslik : listingMap.get(row.ilan_id)?.baslik;
    const nights = Math.max(
      0,
      Math.ceil(
        (new Date(`${row.cikis_tarihi}T00:00:00`).getTime() -
          new Date(`${row.giris_tarihi}T00:00:00`).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    return {
      referansNo: row.referans_no ?? row.id,
      kullaniciAdi: user?.adSoyad ?? "-",
      email: user?.email ?? "-",
      ilanAdi: listingName ?? "-",
      girisTarihi: row.giris_tarihi,
      cikisTarihi: row.cikis_tarihi,
      geceSayisi: nights,
      misafirSayisi: Number(row.misafir_sayisi ?? 0),
      tutar: Number(row.toplam_fiyat ?? 0),
      durum: STATUS_MAP[normalizeReservationStatus(String(row.durum))]?.label ?? String(row.durum),
      olusturulmaTarihi: row.olusturulma_tarihi ? new Date(String(row.olusturulma_tarihi)).toLocaleString("tr-TR") : "-",
    };
  });
  const calendarRows = filteredReservations.map((row) => ({
    id: row.id,
    ilanAdi: row.paket_id ? packageMap.get(row.paket_id)?.baslik ?? "Paket" : listingMap.get(row.ilan_id)?.baslik ?? "İlan",
    kullaniciAdi: userMap.get(row.kullanici_id) ?? "-",
    girisTarihi: row.giris_tarihi,
    cikisTarihi: row.cikis_tarihi,
    durum: String(row.durum),
  }));
  const quickFilterLinks = [
    { label: "Bugün Oluşan", query: toQueryString(params, { tarih: new Date().toISOString().slice(0, 10) }) },
    { label: "Beklemede", query: toQueryString(params, { durum: "pending" }) },
    { label: "Onaylananlar", query: toQueryString(params, { durum: "approved" }) },
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
        <AdminFormField label="Arama" className="xl:col-span-2">
          <AdminInput
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Referans no, ad soyad, e-posta..."
          />
        </AdminFormField>
        <AdminFormField label="Durum">
          <AdminSelect name="durum" defaultValue={params.durum ?? ""}>
            <option value="">Tüm durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="cancelled">İptal</option>
          </AdminSelect>
        </AdminFormField>
        <AdminFormField label="Tek tarih">
          <AdminInput
            name="tarih"
            type="date"
            defaultValue={params.tarih ?? ""}
          />
        </AdminFormField>
        <AdminFormField label="Giriş başlangıç">
          <AdminInput
            name="baslangic"
            type="date"
            defaultValue={params.baslangic ?? ""}
          />
        </AdminFormField>
        <AdminFormField label="Çıkış bitiş">
          <AdminInput
            name="bitis"
            type="date"
            defaultValue={params.bitis ?? ""}
          />
        </AdminFormField>
        <AdminFormField label="Tür">
          <AdminSelect name="tip" defaultValue={params.tip ?? ""}>
            <option value="">Tüm türler</option>
            <option value="villa">Villa</option>
            <option value="tekne">Tekne</option>
          </AdminSelect>
        </AdminFormField>
        <AdminFormField label="Sıralama">
          <AdminSelect
            name="siralama"
            defaultValue={params.siralama ?? "yeni"}
          >
            <option value="yeni">Oluşturulma (Yeni → Eski)</option>
            <option value="eski">Oluşturulma (Eski → Yeni)</option>
          </AdminSelect>
        </AdminFormField>
        <div className="xl:col-span-6 flex flex-wrap gap-2">
          <AdminActionButton type="submit" variant="primary" size="md" className="w-full sm:w-auto">
            Filtrele
          </AdminActionButton>
          <AdminActionButton
            href="/yonetim/rezervasyonlar"
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
          >
            Filtreleri temizle
          </AdminActionButton>
        </div>
      </AdminFilterBar>
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/yonetim/rezervasyonlar?${toQueryString(params, { gorunum: "liste" })}`}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${view === "liste" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`}
          >
            Liste
          </Link>
          <Link
            href={`/yonetim/rezervasyonlar?${toQueryString(params, { gorunum: "takvim" })}`}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${view === "takvim" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`}
          >
            Takvim
          </Link>
          <ReservationExportButton rows={exportRows} />
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {totalReservations} rezervasyon listeleniyor.
      </p>

      {filteredReservations.length === 0 ? (
        <AdminEmptyState message="Henüz kayıt yok" actionHref="/konaklama" actionLabel="İlk rezervasyon için ilana git →" />
      ) : view === "takvim" ? (
        <ReservationsCalendarView reservations={calendarRows} />
      ) : (
        <>
      <AdminMobileCardList>
        {filteredReservations.map((row) => (
          <AdminMobileCard key={row.id}>
            <p className="text-sm font-semibold text-slate-800">{row.referans_no ?? row.id}</p>
            <p className="mt-1 text-xs text-slate-500">
              {format(new Date(`${row.giris_tarihi}T00:00:00`), "dd MMM", { locale: tr })} - {format(new Date(`${row.cikis_tarihi}T00:00:00`), "dd MMM yyyy", { locale: tr })}
            </p>
            <p className="mt-1 text-xs text-slate-600">{userMap.get(row.kullanici_id) ?? "-"}</p>
            <p className="mt-2 text-sm font-semibold text-[#0e9aa7]">{formatCurrency(row.toplam_fiyat)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ReservationStatusSelect reservationId={row.id} initialStatus={normalizeReservationStatus(String(row.durum))} />
              <ReservationDetailButton reservation={{
                ...(row as Record<string, unknown>),
                kullanici_adi: userMap.get(row.kullanici_id) ?? "-",
                kullanici_email: userDetailMap.get(row.kullanici_id)?.email ?? "-",
                kullanici_telefon: userDetailMap.get(row.kullanici_id)?.telefon ?? "-",
                ilan_baslik: row.paket_id ? packageMap.get(row.paket_id)?.baslik ?? "Paket" : listingMap.get(row.ilan_id)?.baslik ?? "-",
              }} />
            </div>
          </AdminMobileCard>
        ))}
      </AdminMobileCardList>
      <AdminDataTable minWidthClass="min-w-[1120px]">
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>Tarih</AdminTableHeaderCell>
                <AdminTableHeaderCell>
                  <a
                    href={sortToggleQuery ? `/yonetim/rezervasyonlar?${sortToggleQuery}` : "/yonetim/rezervasyonlar"}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    Oluşturulma {sortAsc ? "↑" : "↓"}
                  </a>
                </AdminTableHeaderCell>
                <AdminTableHeaderCell>Ref No</AdminTableHeaderCell>
                <AdminTableHeaderCell>Kullanıcı</AdminTableHeaderCell>
                <AdminTableHeaderCell>İlan / Paket</AdminTableHeaderCell>
                <AdminTableHeaderCell>Misafir</AdminTableHeaderCell>
                <AdminTableHeaderCell>Tutar</AdminTableHeaderCell>
                <AdminTableHeaderCell>Durum</AdminTableHeaderCell>
                <AdminTableHeaderCell>İşlem</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {filteredReservations.map((row) => (
                <AdminTableRow key={row.id}>
                  <AdminTableCell className="whitespace-nowrap">
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
                  </AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap">
                    {row.olusturulma_tarihi
                      ? format(new Date(String(row.olusturulma_tarihi)), "dd MMM yyyy HH:mm", { locale: tr })
                      : "-"}
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-xs text-slate-500">{row.referans_no ? `${row.referans_no.slice(0, 8)}...` : "-"}</AdminTableCell>
                  <AdminTableCell>
                    <Link
                      href={`/yonetim/kullanicilar?q=${encodeURIComponent(userMap.get(row.kullanici_id) ?? row.kullanici_id)}`}
                      className="font-medium text-sky-700 hover:underline"
                    >
                      {userMap.get(row.kullanici_id) ?? "-"}
                    </Link>
                    <p className="text-xs text-slate-500">{userDetailMap.get(row.kullanici_id)?.email ?? "-"}</p>
                    <p className="text-xs text-slate-400">{userDetailMap.get(row.kullanici_id)?.telefon ?? "-"}</p>
                  </AdminTableCell>
                  <AdminTableCell>
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
                  </AdminTableCell>
                  <AdminTableCell className="text-slate-500">{row.misafir_sayisi}</AdminTableCell>
                  <AdminTableCell className="font-semibold text-slate-800">{formatCurrency(row.toplam_fiyat)}</AdminTableCell>
                  <AdminTableCell>
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
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <ReservationStatusSelect
                        reservationId={row.id}
                        initialStatus={normalizeReservationStatus(String(row.durum))}
                      />
                      <ReservationDetailButton reservation={{
                        ...(row as Record<string, unknown>),
                        kullanici_adi: userMap.get(row.kullanici_id) ?? "-",
                        kullanici_email: userDetailMap.get(row.kullanici_id)?.email ?? "-",
                        kullanici_telefon: userDetailMap.get(row.kullanici_id)?.telefon ?? "-",
                        ilan_baslik: row.paket_id ? packageMap.get(row.paket_id)?.baslik ?? "Paket" : listingMap.get(row.ilan_id)?.baslik ?? "-",
                      }} />
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </tbody>
      </AdminDataTable>
        </>
      )}
    </AdminPageLayout>
  );
}
