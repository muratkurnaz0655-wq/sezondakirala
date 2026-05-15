import { createClient } from "@/lib/supabase/client";
import { getPublicSupabase } from "@/lib/supabase/public-anon";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Kamu katalog sayfaları — anon RLS ile tutarlı okuma */
export function getCatalogSupabase(): SupabaseClient {
  return getPublicSupabase() ?? createClient();
}
