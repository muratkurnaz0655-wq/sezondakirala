import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionMaxAgeSeconds,
  hasAdminCookieSession,
} from "@/lib/admin-session";
import { requireAdminUser } from "@/lib/auth/guards";

export async function GET() {
  const hasCookie = await hasAdminCookieSession();
  if (!hasCookie) {
    return NextResponse.json({ ok: false, reason: "cookie_expired" }, { status: 401 });
  }

  const admin = await requireAdminUser();
  if (!admin.ok) {
    const response = NextResponse.json({ ok: false, reason: "auth_expired" }, { status: 401 });
    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
    return response;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(admin.user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: getAdminSessionMaxAgeSeconds(),
    path: "/",
  });
  return response;
}
