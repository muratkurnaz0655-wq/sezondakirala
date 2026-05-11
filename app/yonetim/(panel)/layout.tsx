import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminPanelChrome } from "@/components/admin/AdminPanelChrome";
import { AdminSessionKeeper } from "@/components/admin/admin-session-keeper";
import type { AdminNotification } from "@/components/admin/AdminTopbar";
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
  let notifications: AdminNotification[] = [];
  let unreadCount = 0;
  let pendingReservationCount = 0;

  try {
    const supabase = createAdminClient();
    const [notifRes, unreadResult] = await Promise.all([
      supabase
        .from("bildirimler")
        .select("*")
        .order("olusturulma_tarihi", { ascending: false })
        .limit(20),
      supabase.from("bildirimler").select("*", { count: "exact", head: true }).eq("okundu", false),
    ]);

    if (notifRes.error) {
      console.error("[admin-panel-layout] bildirim listesi:", notifRes.error);
    }
    unreadCount = unreadResult.count ?? 0;
    if (unreadResult.error) {
      console.error("[admin-panel-layout] okunmamis bildirim sayimi:", unreadResult.error);
    }

    notifications = (notifRes.data ?? []).map((row) => ({
      id: String(row.id),
      tip: row.tip ?? null,
      baslik: row.baslik ?? null,
      mesaj: row.mesaj ?? null,
      olusturulma_tarihi:
        row.olusturulma_tarihi == null ? "" : String(row.olusturulma_tarihi),
      entity_tip: row.entity_tip ?? null,
      entity_id: row.entity_id != null && row.entity_id !== "" ? String(row.entity_id) : null,
      okundu: Boolean(row.okundu),
      href:
        row.entity_tip === "rezervasyon"
          ? `/yonetim/rezervasyonlar/${String(row.entity_id ?? "")}`
          : row.entity_tip === "ilan"
            ? `/yonetim/ilanlar/${String(row.entity_id ?? "")}`
            : row.entity_tip === "kullanici"
              ? `/yonetim/kullanicilar/${String(row.entity_id ?? "")}`
              : "/yonetim",
    }));

    const pendingRes = await supabase
      .from("rezervasyonlar")
      .select("*", { count: "exact", head: true })
      .in("durum", ["pending", "beklemede", "onay_bekliyor", "odeme_bekleniyor"]);
    if (pendingRes.error) {
      console.error("[admin-panel-layout] bekleyen rezervasyon sayimi:", pendingRes.error);
    }
    pendingReservationCount = pendingRes.count ?? 0;
  } catch (e) {
    console.error("[admin-panel-layout] supabase:", e);
  }

  return (
    <>
      <AdminSessionKeeper />
      <AdminPanelChrome
        kullanici={panelKullaniciOzeti}
        notifications={notifications}
        unreadCount={unreadCount}
        pendingReservationCount={pendingReservationCount ?? 0}
      >
        {children}
      </AdminPanelChrome>
    </>
  );
}
