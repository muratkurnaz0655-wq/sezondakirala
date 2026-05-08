import Link from "next/link";
import { Plus } from "lucide-react";
import { BekleyenIlanlar } from "@/components/admin/BekleyenIlanlar";
import { SonRezervasyonlar } from "@/components/admin/SonRezervasyonlar";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminDashboardCharts } from "@/components/admin-dashboard-charts";
import { formatCurrency } from "@/lib/utils/format";
import { normalizeReservationStatus } from "@/lib/reservation-status";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("tr-TR", { month: "short" });
}

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const [
    { count: toplamIlan },
    { count: aktifIlan },
    { count: bekleyen },
    { count: toplamKullanici },
    { count: toplamRezervasyonlar },
    { count: bekleyenRezervasyon },
    { data: reservations },
    { data: settings },
  ] = await Promise.all([
    supabase.from("ilanlar").select("id", { count: "exact", head: true }),
    supabase.from("ilanlar").select("id", { count: "exact", head: true }).eq("aktif", true),
    supabase.from("ilanlar").select("id", { count: "exact", head: true }).eq("aktif", false),
    supabase.from("kullanicilar").select("id", { count: "exact", head: true }),
    supabase.from("rezervasyonlar").select("id", { count: "exact", head: true }),
    supabase.from("rezervasyonlar").select("id", { count: "exact", head: true }).eq("durum", "beklemede"),
    supabase
      .from("rezervasyonlar")
      .select("id,durum,giris_tarihi,cikis_tarihi,toplam_fiyat,olusturulma_tarihi")
      .gte("olusturulma_tarihi", new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString()),
    supabase.from("ayarlar").select("komisyon_orani").order("olusturulma_tarihi", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const currentMonthRows = (reservations ?? []).filter((row) => {
    const created = row.olusturulma_tarihi ? new Date(String(row.olusturulma_tarihi)) : null;
    return created && created >= monthStart && created <= monthEnd;
  });
  const monthlyRevenue = currentMonthRows.reduce((sum, row) => sum + Number(row.toplam_fiyat ?? 0), 0);
  const commissionRate = Number(settings?.komisyon_orani ?? 0.1);
  const commissionRevenue = monthlyRevenue * (Number.isFinite(commissionRate) ? commissionRate : 0.1);
  const totalBookableDays = Math.max(1, (aktifIlan ?? 0) * monthEnd.getDate());
  const occupiedDays = currentMonthRows
    .filter((row) => normalizeReservationStatus(String(row.durum)) === "onaylandi")
    .reduce((sum, row) => {
      const start = new Date(`${row.giris_tarihi}T00:00:00`);
      const end = new Date(`${row.cikis_tarihi}T00:00:00`);
      return sum + Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }, 0);
  const occupancyRate = Math.round((occupiedDays / totalBookableDays) * 100);
  const monthlyKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return monthKey(date);
  });
  const monthlyRevenueData = monthlyKeys.map((key) => ({
    month: formatMonthLabel(key),
    revenue: (reservations ?? [])
      .filter((row) => row.olusturulma_tarihi && monthKey(new Date(String(row.olusturulma_tarihi))) === key)
      .reduce((sum, row) => sum + Number(row.toplam_fiyat ?? 0), 0),
  }));
  const dailyReservationData = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (29 - index));
    const key = dateKey(date);
    return {
      day: date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
      count: (reservations ?? []).filter((row) => row.olusturulma_tarihi && dateKey(new Date(String(row.olusturulma_tarihi))) === key).length,
    };
  });

  return (
    <AdminPageLayout
      title="Yönetim Paneli"
      description="Platformın genel metriklerini ve son hareketleri izleyin."
      actions={
        <AdminActionButton href="/yonetim/ilanlar" variant="primary" size="md">
          <Plus className="h-4 w-4" />
          Yeni İlan
        </AdminActionButton>
      }
    >
      <AdminStatsRow
        items={[
          { label: "Toplam İlan", value: toplamIlan ?? 0, tone: "default" },
          { label: "Yayında", value: aktifIlan ?? 0, tone: "success" },
          { label: "Onay Bekleyen", value: bekleyen ?? 0, tone: "warning" },
          { label: "Kullanıcı", value: toplamKullanici ?? 0, tone: "purple" },
          { label: "Rezervasyon", value: toplamRezervasyonlar ?? 0, tone: "info" },
          { label: "Bu Ay Ciro", value: formatCurrency(monthlyRevenue), tone: "success" },
          { label: "Bu Ay Komisyon Geliri", value: formatCurrency(commissionRevenue), tone: "purple" },
          { label: "Doluluk Oranı", value: `%${occupancyRate}`, tone: "info" },
          { label: "Beklemedeki Rezervasyon", value: bekleyenRezervasyon ?? 0, tone: "warning" },
        ]}
      />

      <div className="mt-6">
        <AdminDashboardCharts monthlyRevenueData={monthlyRevenueData} dailyReservationData={dailyReservationData} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Onay Bekleyen İlanlar</h3>
            <Link href="/yonetim/ilanlar?durum=bekleyen" className="text-sm font-medium text-blue-600 transition-all duration-200 hover:text-blue-700">
              Tümünü Gör →
            </Link>
          </div>
          <BekleyenIlanlar />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Son Rezervasyonlar</h3>
            <Link href="/yonetim/rezervasyonlar" className="text-sm font-medium text-blue-600 transition-all duration-200 hover:text-blue-700">
              Tümünü Gör →
            </Link>
          </div>
          <SonRezervasyonlar />
        </div>
      </div>
    </AdminPageLayout>
  );
}
