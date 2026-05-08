import { requireAdminUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminLogInput = {
  action: string;
  target: string;
};

export async function recordAdminAction({ action, target }: AdminLogInput) {
  try {
    const admin = await requireAdminUser();
    if (!admin.ok) return;

    const supabase = createAdminClient();
    await supabase.from("admin_islem_loglari").insert({
      kullanici: admin.user.email ?? admin.user.id,
      islem: action,
      etkilenen_kayit: target,
    });
  } catch {
    // Log tablosu olmayan ortamlarda ana işlemi engelleme.
  }
}
