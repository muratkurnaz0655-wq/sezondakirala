import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function titleForTip(tip: string | null, fallback: string | null) {
  if (tip === "yeni_rezervasyon") return fallback ?? "Rezervasyonunuz oluşturuldu";
  if (tip === "iptal_rezervasyon") return "Rezervasyon iptal edildi";
  if (tip === "yeni_kullanici") return "Yeni kullanıcı kaydı";
  if (tip === "yeni_ilan") return "Yeni ilan eklendi";
  return fallback ?? "Bildirim";
}

function hrefForNotification(item: { entity_tip: string | null; entity_id: string | null }) {
  if (item.entity_tip === "rezervasyon" && item.entity_id) return `/panel/rezervasyonlar/${item.entity_id}`;
  if (item.entity_tip === "ilan") return "/panel/ilanlarim";
  if (item.entity_tip === "kullanici") return "/panel/profilim";
  return null;
}

export default async function PanelNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris?redirect=/panel/bildirimler");

  const { data: notifications } = await supabase
    .from("bildirimler")
    .select("id, tip, baslik, mesaj, okundu, olusturulma_tarihi, hedef_kullanici_id, entity_tip, entity_id")
    .order("olusturulma_tarihi", { ascending: false })
    .limit(100);

  const visibleNotifications = (notifications ?? []).filter((item) => {
    if (item.hedef_kullanici_id === user.id) return true;
    // Broadcast notifications: no explicit target and no entity linkage.
    return !item.hedef_kullanici_id && !item.entity_tip;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Bildirimlerim</h1>
      {!visibleNotifications.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-700">Henüz bildiriminiz yok.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleNotifications.map((item) => {
            const href = hrefForNotification({
              entity_tip: item.entity_tip ?? null,
              entity_id: item.entity_id ? String(item.entity_id) : null,
            });
            const card = (
              <div
                className={`rounded-xl border px-4 py-3 ${
                  item.okundu ? "border-slate-200 bg-white" : "border-blue-100 bg-blue-50/70"
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{titleForTip(item.tip, item.baslik)}</p>
                <p className="mt-1 text-xs text-slate-600">{item.mesaj ?? "-"}</p>
                <p className="mt-1 text-[11px] text-slate-400">{formatDate(item.olusturulma_tarihi)}</p>
              </div>
            );

            if (!href) return <div key={item.id}>{card}</div>;
            return (
              <Link key={item.id} href={href} className="block transition-transform hover:translate-x-0.5">
                {card}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
