import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminPanelChrome } from "@/components/admin/AdminPanelChrome";
import { AdminSessionKeeper } from "@/components/admin/admin-session-keeper";
import { hasAdminCookieSession } from "@/lib/admin-session";
import { requireAdminUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const panelKullaniciOzeti = {
  ad_soyad: "Yönetici",
  email: null as string | null,
  rol: "admin" as const,
};

export default async function AdminPanelSegmentLayout({ children }: { children: ReactNode }) {
  if (!(await hasAdminCookieSession())) {
    redirect("/yonetim/giris");
  }

  const admin = await requireAdminUser();
  if (!admin.ok) {
    redirect("/yonetim/giris");
  }
  const supabase = createAdminClient();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 1);
  const since = sinceDate.toISOString();
  const [{ data: recentReservations }, { data: pendingListings }, { data: canceledReservations }] = await Promise.all([
    supabase.from("rezervasyonlar").select("id,referans_no").gte("olusturulma_tarihi", since).order("olusturulma_tarihi", { ascending: false }).limit(5),
    supabase.from("ilanlar").select("id,baslik").eq("aktif", false).order("olusturulma_tarihi", { ascending: false }).limit(5),
    supabase.from("rezervasyonlar").select("id,referans_no").eq("durum", "iptal").gte("olusturulma_tarihi", since).order("olusturulma_tarihi", { ascending: false }).limit(5),
  ]);
  const notifications = [
    ...(recentReservations ?? []).map((row) => ({
      id: `rez-${row.id}`,
      label: `Yeni rezervasyon: ${row.referans_no ?? row.id}`,
      href: "/yonetim/rezervasyonlar",
      tone: "info" as const,
    })),
    ...(pendingListings ?? []).map((row) => ({
      id: `ilan-${row.id}`,
      label: `Onay bekleyen ilan: ${row.baslik ?? row.id}`,
      href: "/yonetim/ilanlar?durum=bekleyen",
      tone: "warning" as const,
    })),
    ...(canceledReservations ?? []).map((row) => ({
      id: `iptal-${row.id}`,
      label: `İptal edilen rezervasyon: ${row.referans_no ?? row.id}`,
      href: "/yonetim/rezervasyonlar?durum=iptal",
      tone: "danger" as const,
    })),
  ];

  return (
    <>
      <AdminSessionKeeper />
      <AdminPanelChrome kullanici={panelKullaniciOzeti} notifications={notifications}>{children}</AdminPanelChrome>
    </>
  );
}
