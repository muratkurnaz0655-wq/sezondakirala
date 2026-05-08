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
  const [{ data: notificationRows }, unreadResult] = await Promise.all([
    supabase
      .from("bildirimler")
      .select("*")
      .order("olusturulma_tarihi", { ascending: false })
      .limit(20),
    supabase.from("bildirimler").select("*", { count: "exact", head: true }).eq("okundu", false),
  ]);

  const notifications = (notificationRows ?? []).map((row) => ({
    id: row.id,
    tip: row.tip ?? null,
    baslik: row.baslik ?? null,
    mesaj: row.mesaj ?? null,
    olusturulma_tarihi: row.olusturulma_tarihi,
    entity_tip: row.entity_tip ?? null,
    entity_id: row.entity_id ? String(row.entity_id) : null,
    okundu: Boolean(row.okundu),
    href:
      row.entity_tip === "rezervasyon"
        ? `/yonetim/rezervasyonlar/${row.entity_id}`
        : row.entity_tip === "ilan"
          ? `/yonetim/ilanlar/${row.entity_id}`
          : row.entity_tip === "kullanici"
            ? `/yonetim/kullanicilar/${row.entity_id}`
            : "/yonetim",
  }));
  const unreadCount = unreadResult.count ?? 0;

  return (
    <>
      <AdminSessionKeeper />
      <AdminPanelChrome kullanici={panelKullaniciOzeti} notifications={notifications} unreadCount={unreadCount}>{children}</AdminPanelChrome>
    </>
  );
}
