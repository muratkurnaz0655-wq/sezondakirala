import Link from "next/link";
import { Plus } from "lucide-react";
import { BekleyenIlanlar } from "@/components/admin/BekleyenIlanlar";
import { SonRezervasyonlar } from "@/components/admin/SonRezervasyonlar";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const [
    { count: toplamIlan },
    { count: aktifIlan },
    { count: bekleyen },
    { count: toplamKullanici },
    { count: toplamRezervasyonlar },
  ] = await Promise.all([
    supabase.from("ilanlar").select("id", { count: "exact", head: true }),
    supabase.from("ilanlar").select("id", { count: "exact", head: true }).eq("aktif", true),
    supabase.from("ilanlar").select("id", { count: "exact", head: true }).eq("aktif", false),
    supabase.from("kullanicilar").select("id", { count: "exact", head: true }),
    supabase.from("rezervasyonlar").select("id", { count: "exact", head: true }),
  ]);

  return (
    <AdminPageLayout
      title="Yönetim Paneli"
      description="Platformın genel metriklerini ve son hareketleri izleyin."
      actions={
        <Link
          href="/yonetim/ilanlar"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Yeni İlan
        </Link>
      }
    >
      <AdminStatsRow
        items={[
          { label: "Toplam İlan", value: toplamIlan ?? 0, tone: "default" },
          { label: "Yayında", value: aktifIlan ?? 0, tone: "success" },
          { label: "Onay Bekleyen", value: bekleyen ?? 0, tone: "warning" },
          { label: "Kullanıcı", value: toplamKullanici ?? 0, tone: "purple" },
          { label: "Rezervasyon", value: toplamRezervasyonlar ?? 0, tone: "info" },
        ]}
      />

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
