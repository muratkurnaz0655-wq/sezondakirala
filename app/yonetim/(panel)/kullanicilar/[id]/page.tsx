import Link from "next/link";
import { notFound } from "next/navigation";
import { updateUserAccountStatus, updateUserRole } from "@/app/actions/admin";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/AdminDataTable";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminSelect } from "@/components/admin/AdminFormControls";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();
  const [{ data: user }, { data: reservations }, { data: listings }] = await Promise.all([
    supabase.from("kullanicilar").select("*").eq("id", id).maybeSingle(),
    supabase.from("rezervasyonlar").select("*").eq("kullanici_id", id).order("olusturulma_tarihi", { ascending: false }),
    supabase.from("ilanlar").select("id,baslik,konum,tip,gunluk_fiyat,aktif").eq("sahip_id", id).order("olusturulma_tarihi", { ascending: false }),
  ]);

  if (!user) notFound();
  const accountStatus = String(user.hesap_durumu ?? "aktif");

  async function toggleAccountStatus() {
    "use server";
    await updateUserAccountStatus(id, accountStatus === "aktif" ? "donduruldu" : "aktif");
  }

  return (
    <AdminPageLayout
      title={user.ad_soyad ?? user.email ?? "Kullanıcı"}
      description="Kullanıcı bilgileri, rezervasyonları, ilanları ve hesap ayarları."
      actions={<AdminActionButton href="/yonetim/kullanicilar" variant="secondary" size="md">Kullanıcılara Dön</AdminActionButton>}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Kullanıcı Bilgileri</h2>
          <dl className="mt-4 space-y-2 text-sm text-slate-700">
            <div><dt className="font-medium text-slate-900">Ad</dt><dd>{user.ad_soyad ?? "-"}</dd></div>
            <div><dt className="font-medium text-slate-900">E-posta</dt><dd>{user.email ?? "-"}</dd></div>
            <div><dt className="font-medium text-slate-900">Telefon</dt><dd>{user.telefon ?? "-"}</dd></div>
            <div><dt className="font-medium text-slate-900">Kayıt Tarihi</dt><dd>{user.olusturulma_tarihi ? new Date(user.olusturulma_tarihi).toLocaleDateString("tr-TR") : "-"}</dd></div>
            <div><dt className="font-medium text-slate-900">Hesap Durumu</dt><dd>{accountStatus === "aktif" ? "Aktif" : "Donduruldu"}</dd></div>
          </dl>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Yönetim</h2>
          <form action={updateUserRole} className="mt-4 flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={id} />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</span>
              <AdminSelect name="rol" defaultValue={user.rol ?? "ziyaretci"} className="w-40">
                <option value="ziyaretci">ziyaretci</option>
                <option value="ilan_sahibi">ilan_sahibi</option>
                <option value="admin">admin</option>
              </AdminSelect>
            </label>
            <AdminActionButton type="submit" variant="success" size="md">Rolü Kaydet</AdminActionButton>
          </form>
          <form action={toggleAccountStatus} className="mt-4">
            <AdminActionButton type="submit" variant={accountStatus === "aktif" ? "danger" : "success"} size="md">
              {accountStatus === "aktif" ? "Hesabı Dondur" : "Hesabı Aktif Et"}
            </AdminActionButton>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Kullanıcı Rezervasyonları</h2>
        <AdminDataTable>
          <AdminTableHead>
            <tr>
              <AdminTableHeaderCell>Ref No</AdminTableHeaderCell>
              <AdminTableHeaderCell>Tarih</AdminTableHeaderCell>
              <AdminTableHeaderCell>Tutar</AdminTableHeaderCell>
              <AdminTableHeaderCell>Durum</AdminTableHeaderCell>
            </tr>
          </AdminTableHead>
          <tbody>
            {(reservations ?? []).map((reservation) => {
              const status = STATUS_MAP[normalizeReservationStatus(String(reservation.durum))] ?? STATUS_MAP.beklemede;
              return (
                <AdminTableRow key={reservation.id}>
                  <AdminTableCell>{reservation.referans_no ?? reservation.id}</AdminTableCell>
                  <AdminTableCell>{reservation.giris_tarihi} - {reservation.cikis_tarihi}</AdminTableCell>
                  <AdminTableCell>{formatCurrency(Number(reservation.toplam_fiyat ?? 0))}</AdminTableCell>
                  <AdminTableCell><span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color} ${status.bg}`}>{status.label}</span></AdminTableCell>
                </AdminTableRow>
              );
            })}
          </tbody>
        </AdminDataTable>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Kullanıcı İlanları</h2>
        <AdminDataTable>
          <AdminTableHead>
            <tr>
              <AdminTableHeaderCell>İlan</AdminTableHeaderCell>
              <AdminTableHeaderCell>Konum</AdminTableHeaderCell>
              <AdminTableHeaderCell>Fiyat</AdminTableHeaderCell>
              <AdminTableHeaderCell>Durum</AdminTableHeaderCell>
            </tr>
          </AdminTableHead>
          <tbody>
            {(listings ?? []).map((listing) => (
              <AdminTableRow key={listing.id}>
                <AdminTableCell><Link href={`/yonetim/ilanlar/${listing.id}/takvim`} className="font-medium text-sky-700 hover:underline">{listing.baslik}</Link></AdminTableCell>
                <AdminTableCell>{listing.konum}</AdminTableCell>
                <AdminTableCell>{formatCurrency(Number(listing.gunluk_fiyat ?? 0))}</AdminTableCell>
                <AdminTableCell>{listing.aktif ? "Yayında" : "Pasif"}</AdminTableCell>
              </AdminTableRow>
            ))}
          </tbody>
        </AdminDataTable>
      </section>
    </AdminPageLayout>
  );
}
