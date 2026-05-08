import { requireAdminUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminLogInput = {
  islem: string;
  entityTip: string;
  entityId: string;
  entityBaslik?: string | null;
  detaylar?: Record<string, unknown> | null;
};

export async function recordAdminAction({ islem, entityTip, entityId, entityBaslik = null, detaylar = null }: AdminLogInput) {
  try {
    const admin = await requireAdminUser();
    if (!admin.ok) return;

    const supabase = createAdminClient();
    await supabase.from("admin_loglar").insert({
      kullanici_id: admin.user.id,
      kullanici_email: admin.user.email ?? null,
      islem,
      entity_tip: entityTip,
      entity_id: entityId,
      entity_baslik: entityBaslik,
      detaylar,
    });
  } catch {
    // Log tablosu olmayan ortamlarda ana işlemi engelleme.
  }
}
