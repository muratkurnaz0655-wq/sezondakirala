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
  const [{ count: unreadCount }, { data: notificationRows }] = await Promise.all([
    supabase.from("bildirimler").select("*", { count: "exact", head: true }).eq("okundu", false),
    supabase.from("bildirimler").select("*").order("olusturulma_tarihi", { ascending: false }).limit(20),
  ]);
  const notifications = (notificationRows ?? []).map((row) => ({
    id: row.id,
    label: `${row.baslik ?? "Bildirim"}: ${row.mesaj ?? ""}`.trim(),
    href:
      row.entity_tip === "rezervasyon"
        ? `/yonetim/rezervasyonlar/${row.entity_id}`
        : row.entity_tip === "ilan"
          ? `/yonetim/ilanlar/${row.entity_id}`
          : row.entity_tip === "kullanici"
            ? `/yonetim/kullanicilar/${row.entity_id}`
            : "/yonetim",
    tone: row.okundu ? "info" as const : row.tip === "hata" ? "danger" as const : row.tip === "uyari" ? "warning" as const : "info" as const,
  }));

  return (
    <>
      <AdminSessionKeeper />
      <AdminPanelChrome kullanici={panelKullaniciOzeti} notifications={notifications} unreadCount={unreadCount ?? 0}>{children}</AdminPanelChrome>
    </>
  );
}
