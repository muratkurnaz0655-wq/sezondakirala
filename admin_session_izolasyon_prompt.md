# SezondalKirala — Admin & Site Session İzolasyonu

## SORUN
Admin paneli (/yonetim) ile normal site aynı Supabase session'ını paylaşıyor.
/yonetim/giris'te giriş yapınca normal site header'ı da o kullanıcıyı görüyor.
İkisi tamamen birbirinden izole olmalı — admin cookie'si site cookie'sini hiç etkilememeli.

---

## ÇÖZÜM — İki ayrı Supabase client, iki ayrı storage key

### 1. lib/supabase/client.ts — Normal site browser client
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'sk-site-auth', // Normal site için özel key
      }
    }
  )
}
```

### 2. lib/supabase/admin-client.ts — Admin browser client (yeni dosya)
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createAdminBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'sk-admin-auth', // Admin için tamamen farklı key
      }
    }
  )
}
```

### 3. lib/supabase/server.ts — Normal site server client
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sk-site', // Normal site cookie prefix
      },
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          cs.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )
}
```

### 4. lib/supabase/admin-server.ts — Admin server client (yeni dosya)
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createAdminServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sk-admin', // Admin cookie prefix — site cookie'lerinden tamamen ayrı
      },
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          cs.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )
}
```

### 5. app/yonetim/ altındaki TÜM dosyaları güncelle

`app/yonetim/` klasörü altındaki her Client Component'te:
- `createClient()` → `createAdminBrowserClient()` ile değiştir
- import'u `@/lib/supabase/admin-client`'tan al

`app/yonetim/` klasörü altındaki her Server Component ve layout'ta:
- `createClient()` → `createAdminServerClient()` ile değiştir
- import'u `@/lib/supabase/admin-server`'dan al

Özellikle şu dosyaları güncelle:
- `app/yonetim/layout.tsx`
- `app/yonetim/giris/page.tsx` veya AdminGirisForm component'i
- `components/admin/AdminSidebar.tsx`
- `components/admin/AdminTopbar.tsx`
- `app/yonetim/ilanlar/page.tsx`
- `app/yonetim/rezervasyonlar/page.tsx`
- `app/yonetim/kullanicilar/page.tsx`
- `app/yonetim/paketler/page.tsx`
- `app/yonetim/ayarlar/page.tsx`
- `app/yonetim/ilanlar/[id]/takvim/page.tsx`
- app/yonetim/ altındaki diğer tüm dosyalar

### 6. middleware.ts — Admin ve site route'larını tamamen ayrı handle et

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // ── ADMIN ROUTE'LARI ──────────────────────────────────────
  if (pathname.startsWith('/yonetim')) {
    // Giriş sayfasını koru — redirect loop olmasın
    if (pathname === '/yonetim/giris') {
      return response
    }

    // Admin cookie'siyle kontrol et — site cookie'sine BAKMA
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: { name: 'sk-admin' },
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cs) {
            cs.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          }
        }
      }
    )

    const { data: { user } } = await adminSupabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/yonetim/giris', request.url))
    }

    // Admin rol kontrolü
    const { data: kullanici } = await adminSupabase
      .from('kullanicilar')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (kullanici?.rol !== 'admin') {
      return NextResponse.redirect(new URL('/yonetim/giris', request.url))
    }

    return response
  }

  // ── NORMAL SİTE ROUTE'LARI ────────────────────────────────
  if (pathname.startsWith('/panel')) {
    // Site cookie'siyle kontrol et — admin cookie'sine BAKMA
    const siteSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: { name: 'sk-site' },
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cs) {
            cs.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          }
        }
      }
    )

    const { data: { user } } = await siteSupabase.auth.getUser()

    if (!user) {
      const redirect = encodeURIComponent(pathname)
      return NextResponse.redirect(
        new URL(`/giris?redirect=${redirect}`, request.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|videos|images|api).*)'],
}
```

### 7. components/Header.tsx — Sadece site client'ı kullan

Header component'i normal site client'ını kullanmalı, admin session'ına hiç bakmamalı:

```tsx
'use client'
import { createClient } from '@/lib/supabase/client' // sk-site-auth kullanır

export function Header() {
  const supabase = createClient() // Admin session'ını görmez

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])
  // ...
}
```

---

## TEST SENARYOLARI

Değişiklikler sonrası şunları test et:

1. `/yonetim/giris`'te admin girişi yap
2. Yeni sekmede `sezondakirala.com`'u aç → header'da admin kullanıcısı **görünmemeli**
3. Normal siteden kullanıcı girişi yap
4. `/yonetim`'e git → admin giriş sayfasına yönlendirmeli (normal kullanıcı admin'e giremez)
5. Admin panelinden çıkış yap → normal site oturumu **etkilenmemeli**
6. Normal siteden çıkış yap → admin paneli oturumu **etkilenmemeli**

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```
