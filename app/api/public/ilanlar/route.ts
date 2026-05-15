import { NextRequest, NextResponse } from "next/server";
import { queryPublishedListings } from "@/lib/catalog-queries";
import { getPublicSupabase } from "@/lib/supabase/public-anon";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/** Kamuya açık ilan listesi — RLS uyumsuzluğunda service role yedek okuma. */
export async function GET(request: NextRequest) {
  const tip = request.nextUrl.searchParams.get("tip");
  if (tip !== "villa" && tip !== "tekne") {
    return NextResponse.json({ error: "Gecersiz tip" }, { status: 400 });
  }

  if (!isSupabaseEnvConfigured()) {
    return NextResponse.json([]);
  }

  const limit = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 200));

  try {
    const admin = createAdminClient();
    const rows = await queryPublishedListings(admin, { tip, limit });
    return NextResponse.json(rows);
  } catch (adminError) {
    console.warn("[api/public/ilanlar] service role yedek degil, anon deneniyor", adminError);
    const pub = getPublicSupabase();
    if (!pub) return NextResponse.json([]);
    const rows = await queryPublishedListings(pub, { tip, limit });
    return NextResponse.json(rows);
  }
}
