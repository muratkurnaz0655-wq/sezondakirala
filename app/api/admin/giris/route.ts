import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionMaxAgeSeconds,
} from "@/lib/admin-session";
import { createClient } from "@/lib/supabase/server";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const ipAttemptStore = new Map<string, { count: number; firstAttemptAt: number }>();

function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function getRateLimitState(ip: string) {
  const now = Date.now();
  const current = ipAttemptStore.get(ip);
  if (!current || now - current.firstAttemptAt > WINDOW_MS) {
    const reset = { count: 0, firstAttemptAt: now };
    ipAttemptStore.set(ip, reset);
    return reset;
  }
  return current;
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const attempts = getRateLimitState(ip);
  if (attempts.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { hata: "Cok fazla giris denemesi. Lutfen daha sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    attempts.count += 1;
    ipAttemptStore.set(ip, attempts);
    return NextResponse.json({ hata: "Gecersiz oturum. Lutfen tekrar giris yapin." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("kullanicilar")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.rol !== "admin") {
    attempts.count += 1;
    ipAttemptStore.set(ip, attempts);
    await supabase.auth.signOut();
    /** 403 yerine 200: tarayıcı "failed request" göstermesin; istemci `basarili` ile ayırır. */
    return NextResponse.json({
      basarili: false,
      hata: "Bu hesap admin paneline erisemiyor.",
      kod: "ADMIN_DEGIL",
    });
  }

  ipAttemptStore.delete(ip);

  const response = NextResponse.json({ basarili: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: getAdminSessionMaxAgeSeconds(),
    path: "/",
  });
  return response;
}
