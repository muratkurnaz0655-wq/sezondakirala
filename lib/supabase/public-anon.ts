import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

let singleton: SupabaseClient | null = null;

/**
 * Çerez kullanmaz; SSG ve `getPlatformSettings` gibi herkese açık okumalar için.
 * RLS kuralları anon rolü için uygun olmalıdır.
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseEnvConfigured()) return null;
  if (singleton) return singleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
  singleton = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return singleton;
}
