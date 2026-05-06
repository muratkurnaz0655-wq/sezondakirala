/**
 * Next.js 16 ağ katmanı: `middleware.ts` yerine bu dosya kullanılır.
 * `/rezervasyon` veya `/rezervasyon/[id]` engellenmez; yalnızca `/yonetim/*` ve `/panel/*` kuralı vardır.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SITE_AUTH_COOKIE_OPTIONS, SITE_AUTH_STORAGE_KEY } from "@/lib/supabase/auth-cookie-options";
import { ADMIN_SESSION_COOKIE, isAdminSessionValue } from "@/lib/admin-session";

function createSiteProxyClient(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookieOptions: SITE_AUTH_COOKIE_OPTIONS,
    auth: { storageKey: SITE_AUTH_STORAGE_KEY },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        if (headers) {
          Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
        }
      },
    },
  });
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const passthrough = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  if (pathname.startsWith("/yonetim") && pathname !== "/yonetim/giris") {
    const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!isAdminSessionValue(adminSession)) {
      const url = request.nextUrl.clone();
      url.pathname = "/yonetim/giris";
      return NextResponse.redirect(url);
    }
    return passthrough();
  }

  if (pathname.startsWith("/panel")) {
    // NOTE:
    // /panel auth check is handled in server components (app/panel/layout.tsx).
    // Doing a hard auth.getUser() check here can produce false negatives on edge/runtime
    // and cause logged-in users to be redirected unexpectedly.
    return passthrough();
  }

  return passthrough();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|videos|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
