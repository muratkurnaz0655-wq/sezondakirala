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

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const [
    { count: toplamIlan },
    { count: aktifIlan },
    { count: onayBekleyenIlan },
    { count: toplamKullanici },
    { count: toplamRezervasyonlar },
    { count: bekleyenRezervasyon },
    { data: monthlyStats },
    { data: dashboardCurrentMonth },
  ] = await Promise.all([
    supabase.from("ilanlar").select("id", { count: "exact", head: true }),
    supabase.from("ilanlar").select("id", { count: "exact", head: true }).eq("aktif", true),
    supabase.from("ilanlar").select("id", { count: "exact", head: true }).eq("onay_durumu", "onay_bekliyor"),
    supabase.from("kullanicilar").select("id", { count: "exact", head: true }),
    supabase.from("rezervasyonlar").select("id", { count: "exact", head: true }),
    supabase.from("rezervasyonlar").select("id", { count: "exact", head: true }).eq("durum", "pending"),
    supabase.from("dashboard_aylik_istatistik").select("*").order("ay", { ascending: false }).limit(6),
    supabase.from("dashboard_bu_ay").select("*").limit(1).maybeSingle(),
  ]);
  const monthlyRevenueData = [...(monthlyStats ?? [])]
    .reverse()
    .map((row) => ({ month: String(row.ay_label ?? row.ay), revenue: Number(row.toplam_ciro ?? 0) }));
  const monthlySummary = dashboardCurrentMonth
    ? {
        approved: Number(dashboardCurrentMonth.onaylanan ?? 0),
        pending: Number(dashboardCurrentMonth.beklemede ?? 0),
        cancelled: Number(dashboardCurrentMonth.iptal ?? 0),
      }
    : { approved: 0, pending: 0, cancelled: 0 };

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
          { label: "Yayındaki İlan", value: aktifIlan ?? 0, tone: "success" },
          { label: "Toplam Kullanıcı", value: toplamKullanici ?? 0, tone: "purple" },
          { label: "Beklemedeki Rezervasyon", value: bekleyenRezervasyon ?? 0, tone: "warning" },
          { label: "Bu Ay Ciro", value: formatCurrency(Number(dashboardCurrentMonth?.bu_ay_ciro ?? 0)), tone: "success" },
          { label: "Bu Ay Komisyon", value: formatCurrency(Number(dashboardCurrentMonth?.bu_ay_komisyon ?? 0)), tone: "info" },
        ]}
      />

      <div className="mt-6">
        <AdminDashboardCharts monthlyRevenueData={monthlyRevenueData} summary={monthlySummary} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Onay Bekleyen İlanlar</h3>
            <Link href="/yonetim/ilanlar?durum=onay_bekliyor" className="text-sm font-medium text-blue-600 transition-all duration-200 hover:text-blue-700">
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
