"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type BildirimRow = {
  id: string;
  hedef_kullanici_id?: string | null;
  tip: string | null;
  entity_tip: string | null;
  entity_id: string | null;
  mesaj: string | null;
};

function isMissingHedefColumnError(message: string | undefined) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("hedef_kullanici_id") && m.includes("does not exist");
}

async function legacyReservationEntityOwned(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  entityId: string | null,
) {
  if (!entityId) return false;
  const { data } = await admin
    .from("rezervasyonlar")
    .select("id")
    .eq("id", entityId)
    .eq("kullanici_id", userId)
    .maybeSingle();
  return Boolean(data);
}

async function legacyReservationRefOwned(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  mesaj: string | null,
) {
  const match = String(mesaj ?? "").match(/Rezervasyon No:\s*([A-Z0-9-]+)/i);
  const referansNo = match?.[1]?.trim();
  if (!referansNo) return false;
  const { data } = await admin
    .from("rezervasyonlar")
    .select("referans_no")
    .eq("kullanici_id", userId)
    .eq("referans_no", referansNo)
    .maybeSingle();
  return Boolean(data);
}

function userMayMarkRow(
  userId: string,
  isAdmin: boolean,
  row: BildirimRow,
  legacyEntityOwned: boolean,
  legacyRefOwned: boolean,
) {
  const hedef = row.hedef_kullanici_id;
  if (hedef === userId) return true;
  if ((hedef === null || hedef === undefined) && row.tip === "duyuru") return true;
  if (isAdmin && (hedef === null || hedef === undefined)) return true;
  if (
    (hedef === null || hedef === undefined) &&
    row.entity_tip === "rezervasyon" &&
    row.entity_id &&
    legacyEntityOwned
  )
    return true;
  if (
    (hedef === null || hedef === undefined) &&
    row.entity_tip === "rezervasyon" &&
    !row.entity_id &&
    legacyRefOwned
  )
    return true;
  return false;
}

export type NotificationMarkResult = { success: true } | { success: false; error: string };

/** Panel / site: kullanıcı bildirimlerini okundu yapar (RPC yoksa da çalışır; service role). */
export async function markMyNotificationsReadAllAction(): Promise<NotificationMarkResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return { success: false, error: "Oturum gerekli." };

    const admin = createAdminClient();
    const payload = { okundu: true as const, okundu_tarihi: new Date().toISOString() };

    const scoped = await admin
      .from("bildirimler")
      .update(payload)
      .eq("okundu", false)
      .or(`hedef_kullanici_id.eq.${user.id},hedef_kullanici_id.is.null`);

    if (scoped.error && isMissingHedefColumnError(scoped.error.message)) {
      const legacy = await admin.from("bildirimler").update(payload).eq("okundu", false);
      if (legacy.error) return { success: false, error: legacy.error.message?.trim() || "Bildirimler güncellenemedi." };
      return { success: true };
    }

    if (scoped.error) return { success: false, error: scoped.error.message?.trim() || "Bildirimler güncellenemedi." };
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}

export async function markMyNotificationReadAction(notificationId: string): Promise<NotificationMarkResult> {
  const id = String(notificationId ?? "").trim();
  if (!id) return { success: false, error: "Geçersiz bildirim." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return { success: false, error: "Oturum gerekli." };

    const { data: profil } = await supabase.from("kullanicilar").select("rol").eq("id", user.id).maybeSingle();
    const isAdmin = profil?.rol === "admin";

    const admin = createAdminClient();
    const { data: row, error: fetchErr } = await admin.from("bildirimler").select("*").eq("id", id).maybeSingle();
    if (fetchErr) return { success: false, error: fetchErr.message?.trim() || "Bildirim bulunamadı." };
    if (!row) return { success: false, error: "Bildirim bulunamadı." };

    const typed = row as BildirimRow;
    let legacyEntityOwned = false;
    let legacyRefOwned = false;
    const hedefUnset = typed.hedef_kullanici_id === null || typed.hedef_kullanici_id === undefined;
    if (hedefUnset && typed.entity_tip === "rezervasyon") {
      if (typed.entity_id) {
        legacyEntityOwned = await legacyReservationEntityOwned(admin, user.id, String(typed.entity_id));
      } else {
        legacyRefOwned = await legacyReservationRefOwned(admin, user.id, typed.mesaj);
      }
    }

    if (!userMayMarkRow(user.id, isAdmin, typed, legacyEntityOwned, legacyRefOwned)) {
      return { success: false, error: "Bu bildirimi güncelleme yetkiniz yok." };
    }

    const { error: updateErr } = await admin
      .from("bildirimler")
      .update({ okundu: true, okundu_tarihi: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) return { success: false, error: updateErr.message?.trim() || "Güncellenemedi." };
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Beklenmeyen hata.";
    return { success: false, error: message };
  }
}
