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

  const { data: profil } = await supabase
    .from("kullanicilar")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profil?.rol === "admin";

  const { data: notifications, error: notificationsError } = await supabase
    .from("bildirimler")
    .select("*")
    .order("olusturulma_tarihi", { ascending: false })
    .limit(100);

  const legacyReservationRows = (notifications ?? []).filter(
    (item) => !item.hedef_kullanici_id && item.entity_tip === "rezervasyon" && Boolean(item.entity_id),
  );
  const legacyReservationByRefRows = (notifications ?? []).filter(
    (item) => !item.hedef_kullanici_id && item.entity_tip === "rezervasyon" && !item.entity_id && Boolean(item.mesaj),
  );
  const { data: ownedReservations } = legacyReservationRows.length
    ? await supabase
        .from("rezervasyonlar")
        .select("id")
        .eq("kullanici_id", user.id)
        .in("id", legacyReservationRows.map((item) => String(item.entity_id)))
    : { data: [] as { id: string }[] };
  const ownedLegacyReservationIds = new Set((ownedReservations ?? []).map((item) => item.id));

  const reservationRefs = legacyReservationByRefRows
    .map((item) => {
      const match = String(item.mesaj ?? "").match(/Rezervasyon No:\s*([A-Z0-9-]+)/i);
      return match?.[1]?.trim() ?? null;
    })
    .filter((value): value is string => Boolean(value));
  const { data: ownedReservationsByRef } = reservationRefs.length
    ? await supabase
        .from("rezervasyonlar")
        .select("referans_no")
        .eq("kullanici_id", user.id)
        .in("referans_no", reservationRefs)
    : { data: [] as { referans_no: string }[] };
  const ownedLegacyReservationRefs = new Set((ownedReservationsByRef ?? []).map((item) => item.referans_no));

  const visibleNotifications = (notifications ?? []).filter((item) => {
    if (!item.hedef_kullanici_id && item.entity_tip === "rezervasyon" && item.entity_id) {
      return ownedLegacyReservationIds.has(String(item.entity_id));
    }
    if (!item.hedef_kullanici_id && item.entity_tip === "rezervasyon" && !item.entity_id) {
      const match = String(item.mesaj ?? "").match(/Rezervasyon No:\s*([A-Z0-9-]+)/i);
      const ref = match?.[1]?.trim() ?? "";
      return Boolean(ref) && ownedLegacyReservationRefs.has(ref);
    }
    if (item.hedef_kullanici_id === user.id) return true;
    if (!item.hedef_kullanici_id && item.tip === "duyuru") return true;
    return isAdmin && !item.hedef_kullanici_id;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Bildirimlerim</h1>
      {notificationsError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Bildirimler yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.
        </div>
      ) : !visibleNotifications.length ? (
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
