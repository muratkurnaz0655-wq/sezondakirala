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
  const { data: notificationRows } = await supabase
    .from("bildirimler")
    .select("*")
    .order("olusturulma_tarihi", { ascending: false })
    .limit(50);

  const reservationNotificationIds = [...new Set(
    (notificationRows ?? [])
      .filter((row) => row.entity_tip === "rezervasyon" && row.entity_id)
      .map((row) => String(row.entity_id)),
  )];
  const { data: reservationRows } = reservationNotificationIds.length
    ? await supabase.from("rezervasyonlar").select("id,durum").in("id", reservationNotificationIds)
    : { data: [] as { id: string; durum: string }[] };
  const reservationStatusMap = new Map((reservationRows ?? []).map((row) => [row.id, String(row.durum)]));

  const filteredRows = (notificationRows ?? []).filter((row) => {
    if (row.entity_tip !== "rezervasyon") return true;
    const status = reservationStatusMap.get(String(row.entity_id ?? ""));
    // Only keep pending reservation notifications in admin bell.
    return status === "pending" || status === "beklemede";
  });

  const notifications = filteredRows.slice(0, 20).map((row) => ({
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
  const unreadCount = filteredRows.filter((row) => !row.okundu).length;

  return (
    <>
      <AdminSessionKeeper />
      <AdminPanelChrome kullanici={panelKullaniciOzeti} notifications={notifications} unreadCount={unreadCount}>{children}</AdminPanelChrome>
    </>
  );
}
