import { createAdminClient } from "@/lib/supabase/admin";

type AdminNotificationInsert = {
  tip: string;
  baslik: string;
  mesaj: string;
  entity_tip?: string | null;
  entity_id?: string | null;
  hedef_kullanici_id?: string | null;
};

export async function insertAdminNotification(payload: AdminNotificationInsert) {
  const admin = createAdminClient();
  const base = {
    tip: payload.tip,
    baslik: payload.baslik,
    mesaj: payload.mesaj,
    entity_tip: payload.entity_tip ?? null,
    entity_id: payload.entity_id ?? null,
    okundu: false,
  };

  if (payload.hedef_kullanici_id) {
    const { error } = await admin.from("bildirimler").insert({
      ...base,
      hedef_kullanici_id: payload.hedef_kullanici_id,
    });
    if (!error) return;
  }

  await admin.from("bildirimler").insert(base);
}
