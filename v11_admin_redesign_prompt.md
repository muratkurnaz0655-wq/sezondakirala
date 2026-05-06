# SezondalKirala — Admin Panel Tam Yeniden Tasarım

## SORUN
Admin paneli (/yonetim) normal site header/footer'ı ile birlikte görünüyor.
Küçük bir kart gibi duruyor, tam ekranı kullanmıyor.
Admin paneli tamamen bağımsız, koyu, profesyonel bir görünüme kavuşmalı.

---

## ADIM 1 — Normal site layout'undan admin'i ayır

### app/layout.tsx — /yonetim sayfalarında Header ve Footer gösterme

```tsx
// app/layout.tsx
import { headers } from 'next/headers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-invoke-path') ?? ''
  const isAdmin = pathname.startsWith('/yonetim')

  return (
    <html lang="tr">
      <body>
        {!isAdmin && <Header />}
        {children}
        {!isAdmin && <Footer />}
      </body>
    </html>
  )
}
```

Eğer headers() ile pathname alınamıyorsa alternatif yöntem — middleware'de header set et:

```ts
// middleware.ts — mevcut koda ekle
response.headers.set('x-pathname', request.nextUrl.pathname)
```

```tsx
// app/layout.tsx
import { headers } from 'next/headers'
const pathname = headers().get('x-pathname') ?? ''
const isAdmin = pathname.startsWith('/yonetim')
```

---

## ADIM 2 — app/yonetim/layout.tsx — Tam ekran admin layout

```tsx
// app/yonetim/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel | SezondalKirala',
  robots: { index: false, follow: false },
}

export default function YonetimLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')
  const pathname = headers().get('x-pathname') ?? ''

  if (!adminSession && pathname !== '/yonetim/giris') {
    redirect('/yonetim/giris')
  }

  const isGirisPage = pathname === '/yonetim/giris'

  if (isGirisPage) {
    // Giriş sayfası — sadece tam ekran içerik, sidebar/topbar yok
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)',
      }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex' }}>
      {/* Sidebar */}
      <AdminSidebar />
      {/* Ana içerik */}
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        <AdminTopbar />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## ADIM 3 — Giriş sayfası — tam ekran, koyu, profesyonel

```tsx
// app/yonetim/giris/page.tsx
export default function AdminGirisPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 100%)' }}>

      {/* Arka plan efektleri */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 rounded-full"
          style={{ background: '#0ea5e9', opacity: 0.08, filter: 'blur(100px)' }} />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 rounded-full"
          style={{ background: '#22c55e', opacity: 0.06, filter: 'blur(120px)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* Login kartı */}
      <div className="relative z-10 w-full max-w-md mx-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center
              font-black text-xl text-white"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #22c55e)' }}>
              SK
            </div>
            <span className="text-white text-2xl font-bold">SezondalKirala</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Yönetim paneline erişmek için giriş yapın</p>
        </div>

        {/* Form kartı */}
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}>
          <AdminGirisForm />
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Siteye Dön
          </a>
        </div>
      </div>
    </div>
  )
}
```

```tsx
// components/admin/AdminGirisForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'

export function AdminGirisForm() {
  const [sifre, setSifre] = useState('')
  const [goster, setGoster] = useState(false)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')

    const res = await fetch('/api/admin/giris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sifre }),
    })

    if (res.ok) {
      router.push('/yonetim')
      router.refresh()
    } else {
      const data = await res.json()
      setHata(data.hata ?? 'Geçersiz şifre')
      setYukleniyor(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider
          text-gray-400 mb-2">
          Şifre
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type={goster ? 'text' : 'password'}
            value={sifre}
            onChange={e => setSifre(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full pl-11 pr-12 py-3.5 rounded-xl text-white text-sm
              placeholder-gray-600 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onFocus={e => (e.target.style.borderColor = '#0ea5e9')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <button type="button" onClick={() => setGoster(!goster)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500
              hover:text-gray-300 transition-colors">
            {goster ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {hata && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={14} />
          {hata}
        </div>
      )}

      <button
        type="submit"
        disabled={yukleniyor || !sifre}
        className="w-full py-3.5 rounded-xl font-semibold text-white text-sm
          transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
          boxShadow: '0 4px 20px rgba(14,165,233,0.25)',
        }}
      >
        {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  )
}
```

---

## ADIM 4 — Admin Sidebar

```tsx
// components/admin/AdminSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Home, Calendar, Package,
  Users, Settings, ExternalLink, LogOut
} from 'lucide-react'

const menuItems = [
  { href: '/yonetim', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/yonetim/ilanlar', label: 'İlanlar', icon: Home },
  { href: '/yonetim/rezervasyonlar', label: 'Rezervasyonlar', icon: Calendar },
  { href: '/yonetim/paketler', label: 'Paketler', icon: Package },
  { href: '/yonetim/kullanicilar', label: 'Kullanıcılar', icon: Users },
  { href: '/yonetim/ayarlar', label: 'Ayarlar', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const handleCikis = async () => {
    await fetch('/api/admin/cikis', { method: 'POST' })
    window.location.href = '/yonetim/giris'
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: '260px',
      background: 'rgba(255,255,255,0.02)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', zIndex: 30,
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '13px',
          }}>SK</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', lineHeight: 1 }}>
              SezondalKirala
            </div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {menuItems.map(({ href, label, icon: Icon, exact }) => {
          const aktif = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '12px', marginBottom: '2px',
              background: aktif ? 'rgba(14,165,233,0.12)' : 'transparent',
              border: aktif ? '1px solid rgba(14,165,233,0.25)' : '1px solid transparent',
              textDecoration: 'none', transition: 'all 0.2s',
            }}>
              <Icon size={17} style={{ color: aktif ? '#0ea5e9' : '#475569', flexShrink: 0 }} />
              <span style={{
                fontSize: '13px', fontWeight: aktif ? 600 : 400,
                color: aktif ? '#e2e8f0' : '#64748b',
              }}>{label}</span>
              {aktif && (
                <div style={{
                  marginLeft: 'auto', width: '4px', height: '4px',
                  borderRadius: '50%', background: '#0ea5e9',
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Alt */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/" target="_blank" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', borderRadius: '12px', textDecoration: 'none',
          color: '#64748b', fontSize: '13px',
        }}>
          <ExternalLink size={15} />
          Siteyi Görüntüle
        </a>
        <button onClick={handleCikis} style={{
          display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
          padding: '10px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'transparent', color: '#64748b', fontSize: '13px',
          marginTop: '2px',
        }}>
          <LogOut size={15} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
```

---

## ADIM 5 — Admin Topbar

```tsx
// components/admin/AdminTopbar.tsx
'use client'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const sayfaBasliklari: Record<string, string> = {
  '/yonetim': 'Dashboard',
  '/yonetim/ilanlar': 'İlan Yönetimi',
  '/yonetim/rezervasyonlar': 'Rezervasyonlar',
  '/yonetim/paketler': 'Paket Yönetimi',
  '/yonetim/kullanicilar': 'Kullanıcılar',
  '/yonetim/ayarlar': 'Ayarlar',
}

export function AdminTopbar() {
  const pathname = usePathname()
  const baslik = sayfaBasliklari[pathname] ?? 'Yönetim'

  return (
    <header style={{
      height: '64px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
      background: 'rgba(13,17,23,0.8)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div>
        <h1 style={{ color: 'white', fontWeight: 700, fontSize: '18px', margin: 0 }}>
          {baslik}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button style={{
          width: '38px', height: '38px', borderRadius: '10px', border: 'none',
          background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bell size={16} color="#64748b" />
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #0ea5e9, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '12px',
          }}>A</div>
          <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500 }}>Admin</span>
        </div>
      </div>
    </header>
  )
}
```

---

## ADIM 6 — Admin sayfaları genel stil

Tüm `/yonetim` alt sayfalarında bu CSS class'larını kullan:

```css
/* globals.css — admin bölümü */
.admin-root {
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.admin-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 24px;
}

.admin-card-hover:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.admin-stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.admin-table td {
  padding: 14px 16px;
  font-size: 13px;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.admin-table tr:hover td {
  background: rgba(255, 255, 255, 0.03);
}

.admin-input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 14px;
  color: white;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}

.admin-input:focus {
  border-color: #0ea5e9;
}

.admin-input::placeholder {
  color: #475569;
}

.admin-btn {
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.admin-btn-primary {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  box-shadow: 0 2px 10px rgba(14, 165, 233, 0.25);
}

.admin-btn-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  box-shadow: 0 2px 10px rgba(34, 197, 94, 0.25);
}

.admin-btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.25);
}

.admin-btn-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-badge {
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
}

.admin-badge-yellow {
  background: rgba(234, 179, 8, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(234, 179, 8, 0.2);
}

.admin-badge-green {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.admin-badge-red {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.admin-badge-blue {
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(14, 165, 233, 0.2);
}
```

---

## ADIM 7 — Dashboard sayfası

```tsx
// app/yonetim/page.tsx
import { createAdminServerClient } from '@/lib/supabase/admin-server'

export default async function AdminDashboard() {
  const supabase = createAdminServerClient()

  const [
    { count: toplamIlan },
    { count: aktifIlan },
    { count: bekleyen },
    { count: toplamKullanici },
    { count: toplamRezervasyonlar },
  ] = await Promise.all([
    supabase.from('ilanlar').select('*', { count: 'exact', head: true }),
    supabase.from('ilanlar').select('*', { count: 'exact', head: true }).eq('aktif', true),
    supabase.from('ilanlar').select('*', { count: 'exact', head: true }).eq('aktif', false),
    supabase.from('kullanicilar').select('*', { count: 'exact', head: true }),
    supabase.from('rezervasyonlar').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Toplam İlan', value: toplamIlan ?? 0, color: '#0ea5e9', icon: '🏠' },
    { label: 'Yayında', value: aktifIlan ?? 0, color: '#22c55e', icon: '✅' },
    { label: 'Onay Bekleyen', value: bekleyen ?? 0, color: '#f59e0b', icon: '⏳', urgent: true },
    { label: 'Kullanıcı', value: toplamKullanici ?? 0, color: '#8b5cf6', icon: '👥' },
    { label: 'Rezervasyon', value: toplamRezervasyonlar ?? 0, color: '#06b6d4', icon: '📅' },
  ]

  return (
    <div>
      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(({ label, value, color, icon, urgent }) => (
          <div key={label} className="admin-stat-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full"
              style={{ background: color, opacity: 0.08, filter: 'blur(20px)',
                transform: 'translate(30%, -30%)' }} />
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
            {urgent && (value ?? 0) > 0 && (
              <div className="admin-badge admin-badge-yellow mt-2">İnceleme Gerekli</div>
            )}
          </div>
        ))}
      </div>

      {/* Son ilanlar ve rezervasyonlar */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <h3 className="text-white font-semibold mb-4">⏳ Onay Bekleyen İlanlar</h3>
          <BekleyenIlanlarList />
        </div>
        <div className="admin-card">
          <h3 className="text-white font-semibold mb-4">📅 Son Rezervasyonlar</h3>
          <SonRezervasyonlarList />
        </div>
      </div>
    </div>
  )
}
```

---

## ADIM 7.5 — ADMIN & KULLANICI OTURUM ÇAKIŞMASI (KRİTİK)

### Sorun
Ekran görüntüsünde görüldüğü gibi admin panelinde de (`/yonetim/paketler`) ana sayfada da aynı "Muratcan" kullanıcısı görünüyor. Admin oturumu ile normal site oturumu tamamen aynı cookie'yi kullanıyor.

### Kök neden
`app/yonetim/layout.tsx` içinde hâlâ normal `createClient()` veya `createAdminServerClient()` kullanıyor olsa bile, admin giriş formu `createClient()` ile Supabase'e giriş yapıyor. Bu giriş normal site'nin da kullandığı aynı Supabase session cookie'sine yazıyor. Böylece header da aynı kullanıcıyı görüyor.

### Çözüm — Admin için Supabase auth'u tamamen bırak, cookie tabanlı şifre sistemi kullan

**1. Admin giriş sistemi — Supabase auth YOK, sadece şifre:**

```ts
// app/api/admin/giris/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { sifre } = await request.json()

  if (sifre !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ hata: 'Geçersiz şifre' }, { status: 401 })
  }

  const response = NextResponse.json({ basarili: true })
  response.cookies.set('admin_session', process.env.ADMIN_PASSWORD!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 saat
    path: '/',
  })
  return response
}
```

```ts
// app/api/admin/cikis/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ basarili: true })
  response.cookies.delete('admin_session')
  return response
}
```

**.env.local'e ekle:**
```
ADMIN_PASSWORD=Admin123!
```

**2. Admin giriş formu — Supabase signIn çağrısı YOK:**

```tsx
// components/admin/AdminGirisForm.tsx
'use client'
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setYukleniyor(true)

  // Supabase auth.signInWithPassword() KULLANMA
  // Sadece kendi API route'una istek at
  const res = await fetch('/api/admin/giris', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sifre }),
  })

  if (res.ok) {
    router.push('/yonetim')
    router.refresh()
  } else {
    setHata('Geçersiz şifre')
    setYukleniyor(false)
  }
}
```

**3. middleware.ts — Admin kontrolü sadece cookie'ye baksın:**

```ts
if (pathname.startsWith('/yonetim') && pathname !== '/yonetim/giris') {
  const adminSession = request.cookies.get('admin_session')
  // Supabase'e sorma, sadece cookie'ye bak
  if (!adminSession || adminSession.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL('/yonetim/giris', request.url))
  }
  // Admin onaylandı, devam et
  return response
}
```

**4. Admin çıkış butonu:**

```tsx
// AdminSidebar veya AdminTopbar
const handleCikis = async () => {
  // Supabase signOut() ÇAĞIRMA — normal site oturumunu bozar
  await fetch('/api/admin/cikis', { method: 'POST' })
  window.location.href = '/yonetim/giris'
}
```

**5. app/yonetim/ altında veri çekme — service role ile:**

Admin sayfaları veri çekerken auth ile ilgili createClient() kullanmak yerine service role kullan:

```ts
// lib/supabase/admin-data.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminDataClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role — RLS bypass
  )
}
```

Tüm `/yonetim` server component'lerinde `createAdminDataClient()` kullan:
```ts
// app/yonetim/ilanlar/page.tsx
import { createAdminDataClient } from '@/lib/supabase/admin-data'

export default async function AdminIlanlar() {
  const supabase = createAdminDataClient()
  const { data: ilanlar } = await supabase.from('ilanlar').select('*')
  // ...
}
```

**6. Normal site header'ında kullanıcı gösterme — site client'ı kullan:**

```tsx
// components/Header.tsx
'use client'
import { createClient } from '@/lib/supabase/client' // Normal site client

// Bu client sadece normal site cookie'sine bakar
// Admin cookie'sini hiç görmez
// Sonuç: Admin panelindeyken ana sayfaya geçince header'da kullanıcı görünmez
```

### Sonuç
- Admin paneli → şifre ile giriş → `admin_session` cookie set edilir → Supabase session hiç açılmaz
- Normal site → Supabase auth ile giriş → normal session cookie set edilir
- İkisi birbirini hiç görmez, çakışma olmaz
- Admin panelinden çıkış yapılsa bile normal site oturumu etkilenmez

---

## ADIM 8 — REZERVASYON SAYFASI 404 SORUNU

### Sorun
"Rezervasyon Yap" butonu `/rezervasyon/[id]` adresine yönlendiriyor ama sayfa 404 veriyor.

### Kontrol et
```bash
# Bu dosya var mı?
app/rezervasyon/[id]/page.tsx
```

Yoksa oluştur. Varsa neden 404 verdiğini bul:

**Sebep 1 — Dosya yok:**
```tsx
// app/rezervasyon/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RezervasyonSayfasi({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { giris?: string; cikis?: string; yetiskin?: string; cocuk?: string; paket?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Giriş yapılmamışsa yönlendir
  if (!user) {
    const redirectUrl = `/rezervasyon/${params.id}?${new URLSearchParams(searchParams as any).toString()}`
    redirect(`/giris?redirect=${encodeURIComponent(redirectUrl)}`)
  }

  // İlanı çek
  const { data: ilan } = await supabase
    .from('ilanlar')
    .select('*, ilan_medyalari(url, sira)')
    .eq('id', params.id)
    .single()

  if (!ilan) redirect('/konaklama')

  return <RezervasyonWizard ilan={ilan} user={user} searchParams={searchParams} />
}
```

**Sebep 2 — Dosya var ama klasör adı yanlış:**
- `app/rezervasyon/[id]/` mi yoksa `app/rezervasyonlar/[id]/` mi kontrol et
- Butondaki link ile klasör adı eşleşmeli

**Sebep 3 — Slug ile id karışıklığı:**
Rezervasyon butonu `ilan.id` kullanıyor ama sayfa `slug` bekliyor olabilir. Kontrol et:
```tsx
// İlan detay sayfasındaki buton:
// DOĞRU: ilan'ın id'si ile git
href={`/rezervasyon/${ilan.id}`}
// YANLIŞ: slug ile gitme
href={`/rezervasyon/${ilan.slug}`} // Bu 404 verir
```

### Rezervasyon wizard — 4 adım

```tsx
// components/RezervasyonWizard.tsx
'use client'
import { useState } from 'react'

export function RezervasyonWizard({ ilan, user, searchParams }) {
  const [aktifAdim, setAktifAdim] = useState(1)
  const [rezervasyon, setRezervAsyon] = useState({
    girisTarihi: searchParams.giris ?? '',
    cikisTarihi: searchParams.cikis ?? '',
    yetiskin: Number(searchParams.yetiskin ?? 2),
    cocuk: Number(searchParams.cocuk ?? 0),
    adSoyad: '',
    telefon: '',
    email: user.email ?? '',
    ozelIstek: '',
    odemeYontemi: '',
  })

  // Adım validasyonu
  const ileriBas = () => {
    if (aktifAdim === 1) {
      if (!rezervasyon.girisTarihi) { alert('Giriş tarihi seçiniz'); return }
      if (!rezervasyon.cikisTarihi) { alert('Çıkış tarihi seçiniz'); return }
    }
    if (aktifAdim === 2) {
      if (!rezervasyon.adSoyad.trim()) { alert('Ad soyad giriniz'); return }
      if (!rezervasyon.telefon.trim()) { alert('Telefon giriniz'); return }
    }
    if (aktifAdim === 3) {
      if (!rezervasyon.odemeYontemi) { alert('Ödeme yöntemi seçiniz'); return }
    }
    setAktifAdim(prev => prev + 1)
  }

  const geriGit = () => setAktifAdim(prev => prev - 1)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Adım göstergesi */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['Detaylar', 'Bilgiler', 'Ödeme', 'Onay'].map((adim, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full
              text-sm font-bold transition-all
              ${aktifAdim > i + 1 ? 'bg-green-500 text-white' :
                aktifAdim === i + 1 ? 'bg-sky-500 text-white' :
                'bg-gray-200 text-gray-500'}`}>
              {aktifAdim > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`hidden md:block ml-2 text-xs font-medium
              ${aktifAdim === i + 1 ? 'text-sky-600' : 'text-gray-400'}`}>
              {adim}
            </span>
            {i < 3 && <div className="w-8 md:w-12 h-0.5 mx-2 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Adım içerikleri */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {aktifAdim === 1 && <Adim1 ilan={ilan} rezervasyon={rezervasyon} setRezervAsyon={setRezervAsyon} />}
        {aktifAdim === 2 && <Adim2 rezervasyon={rezervasyon} setRezervAsyon={setRezervAsyon} />}
        {aktifAdim === 3 && <Adim3 rezervasyon={rezervasyon} setRezervAsyon={setRezervAsyon} ilan={ilan} />}
        {aktifAdim === 4 && <Adim4 rezervasyon={rezervasyon} ilan={ilan} />}
      </div>

      {/* Butonlar */}
      {aktifAdim < 4 && (
        <div className="flex gap-3 mt-6">
          {aktifAdim > 1 && (
            <button onClick={geriGit}
              className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold
                text-gray-700 hover:bg-gray-50 transition-colors">
              ← Geri
            </button>
          )}
          <button onClick={ileriBas}
            className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600
              text-white font-semibold transition-colors">
            {aktifAdim === 3 ? 'Rezervasyonu Tamamla' : 'Devam Et →'}
          </button>
        </div>
      )}
    </div>
  )
}
```

### Rezervasyon oluşturma — veritabanına kaydet

```tsx
// Adım 3'te "Rezervasyonu Tamamla"ya basılınca:
const rezervasyonOlustur = async () => {
  const supabase = createClient() // browser client
  
  const geceSayisi = Math.round(
    (new Date(rezervasyon.cikisTarihi).getTime() - new Date(rezervasyon.girisTarihi).getTime())
    / (1000 * 60 * 60 * 24)
  )
  const toplamFiyat = ilan.gunluk_fiyat * geceSayisi + ilan.temizlik_ucreti

  const referansNo = `SZK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`

  const { data, error } = await supabase.from('rezervasyonlar').insert({
    kullanici_id: user.id,
    ilan_id: ilan.id,
    giris_tarihi: rezervasyon.girisTarihi,
    cikis_tarihi: rezervasyon.cikisTarihi,
    misafir_sayisi: rezervasyon.yetiskin + rezervasyon.cocuk,
    toplam_fiyat: toplamFiyat,
    durum: 'beklemede',
    odeme_yontemi: rezervasyon.odemeYontemi === 'kart' ? 'kart' : 'havale',
    referans_no: referansNo,
  }).select().single()

  if (error) {
    alert('Rezervasyon oluşturulurken hata: ' + error.message)
    return
  }

  setReferansNo(referansNo)
  setAktifAdim(4) // Onay adımına geç
}
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test:
1. /yonetim/giris açıldığında tam ekran koyu sayfa mı görünüyor?
2. Giriş yapınca sidebar solda, topbar üstte görünüyor mu?
3. Normal siteye gittiğinde admin sidebar/topbar görünmüyor mu?
4. Dashboard istatistik kartları görünüyor mu?
5. İlan detayında "Rezervasyon Yap" tıklanınca 404 değil rezervasyon sayfası açılıyor mu?
6. Rezervasyon wizard 4 adımı düzgün çalışıyor mu?
7. Adımlar arası validasyon çalışıyor mu (boş geçilemiyor)?


---

## ADIM 8 — HERO VİDEO & ARAMA FORMU YENİDEN TASARIM

### 8.1 Sorunlar
1. Arama formu (takvim dahil) video üzerinde duruyor — takvim açılınca z-index sorunu nedeniyle arkada kalıyor
2. Video tam ekranı kaplıyor, çok büyük

### 8.2 Yeni yapı — video ve arama formu ayrılacak

```
┌─────────────────────────────────────────┐
│                                         │
│   VİDEO ALANI (sayfanın ortasında,      │
│   tam ekran değil, yuvarlak köşeli)     │
│                                         │
│   Başlık + alt başlık burada            │
│   (video üzerinde, gradient ile)        │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  ARAMA FORMU (videonun ALTINDA,         │
│  beyaz arka plan, gölgeli kart)         │
│  [Giriş Tarihi] [Çıkış Tarihi]         │
│  [Misafir Sayısı] [Villa Ara]           │
└─────────────────────────────────────────┘
```

### 8.3 Kod

```tsx
// app/page.tsx — Hero bölümü

{/* --- VİDEO ALANI --- */}
<section className="relative bg-gray-900" style={{ 
  height: '60vh', 
  minHeight: '420px', 
  maxHeight: '600px' 
}}>
  {/* Video — overflow sadece burada hidden */}
  <div className="absolute inset-0 overflow-hidden">
    <HeroVideo />
    {/* Gradient — sadece metin okunabilirliği için, hafif */}
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.75) 100%)'
    }} />
  </div>

  {/* Başlık — video ortasında */}
  <div className="relative h-full flex flex-col items-center justify-center px-4 text-center pb-12"
    style={{ zIndex: 10 }}>
    
    {/* Üst rozet */}
    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-sm font-medium text-white"
      style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      Fethiye'nin #1 Villa Platformu
    </div>

    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight"
      style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
      Hayalinizdeki Tatil<br />
      <span style={{ color: '#7dd3fc' }}>Fethiye'de Başlar</span>
    </h1>

    <p className="text-lg text-white/75 max-w-xl">
      Lüks villalar, özel tekneler ve TURSAB güvencesiyle unutulmaz tatil deneyimleri
    </p>
  </div>
</section>

{/* --- ARAMA FORMU — VİDEONUN HEMEN ALTINDA --- */}
{/* Video ile form arasında negatif margin ile hafif bindirme efekti */}
<div className="relative" style={{ zIndex: 20, marginTop: '-32px' }}>
  <div className="max-w-4xl mx-auto px-4">
    <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-5"
      style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
      
      {/* Form başlığı */}
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-500">
          🔍 Tarih ve kişi sayısı seçerek müsait villaları görün
        </p>
      </div>

      {/* Form alanları — takvim artık video üzerinde değil */}
      <div className="flex flex-col md:flex-row gap-3">
        
        {/* Giriş - Çıkış Tarihi */}
        <div className="flex-1 relative">
          <DateRangePicker 
            // takvim popup aşağıya doğru açılır, video yok altında
            popupPosition="bottom"
          />
        </div>

        {/* Misafir */}
        <div className="relative" style={{ minWidth: '160px' }}>
          <GuestPicker />
        </div>

        {/* Ara butonu */}
        <button
          onClick={handleSearch}
          className="px-8 py-3.5 rounded-xl font-semibold text-white text-sm
            transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            boxShadow: '0 4px 15px rgba(14,165,233,0.3)',
            minWidth: '120px'
          }}
        >
          Villa Ara
        </button>
      </div>

      {/* Alt bilgi */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
        {[
          { icon: '🏠', text: '50+ Onaylı Villa' },
          { icon: '⛵', text: '20+ Tekne' },
          { icon: '⭐', text: '4.9 Puan' },
          { icon: '✅', text: 'TURSAB Güvenceli' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

### 8.4 Takvim z-index — artık sorun yok

Arama formu video'nun altında olduğu için takvim popup'ı açıldığında:
- Video kısmında z-index çakışması yaşanmaz
- Takvim aşağıya doğru açılır, hiçbir şeyin arkasında kalmaz
- `overflow: hidden` olan video container'ı artık takvimi kesmez

Takvim popup için şu style'ı kullan:
```tsx
// DateRangePicker popup container
<div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
  style={{ zIndex: 9999, minWidth: '300px' }}>
  <DayPicker ... />
</div>
```

### 8.5 Video boyutu — sayfanın ortasında, yuvarlak köşeli (opsiyonel)

Eğer videoyu tam genişlikte değil daha rafine göstermek istiyorsan:
```tsx
{/* Video wrapper — sayfada ortalanmış, padding ile kenar boşluğu */}
<section className="pt-6 px-4 bg-gray-50">
  <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative"
    style={{ height: '55vh', minHeight: '380px', maxHeight: '560px',
             boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
    <HeroVideo />
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)'
    }} />
    {/* Başlık */}
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
      style={{ zIndex: 10 }}>
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
        Hayalinizdeki Tatil<br />
        <span style={{ color: '#7dd3fc' }}>Fethiye'de Başlar</span>
      </h1>
      <p className="text-white/70 text-lg">
        500+ mutlu misafir, TURSAB güvencesiyle
      </p>
    </div>
  </div>
</section>

{/* Arama formu — video'nun hemen altında */}
<div className="bg-gray-50 pb-8 px-4">
  <div className="max-w-4xl mx-auto">
    <div className="bg-white rounded-2xl shadow-xl p-5 -mt-8 relative" style={{ zIndex: 20 }}>
      {/* form içeriği */}
    </div>
  </div>
</div>
```

Bu iki seçenekten hangisi daha güzel görünüyorsa onu kullan.
Video tam genişlik mi (8.3) yoksa yuvarlak köşeli ortalanmış mı (8.5) olsun?
Her ikisini de dene, daha güzel görüneni bırak.

### 8.6 Mobilde

```css
@media (max-width: 768px) {
  /* Video daha kısa */
  .hero-video-section {
    height: 50vh !important;
    min-height: 320px !important;
  }
  
  /* Arama formu tam genişlik */
  .search-form-card {
    margin: -20px 12px 0;
    border-radius: 16px;
  }
  
  /* Form dikey düzen */
  .search-form-inner {
    flex-direction: column;
  }
}
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test:
1. /yonetim/giris açıldığında tam ekran koyu sayfa mı görünüyor?
2. Giriş yapınca sidebar solda, topbar üstte görünüyor mu?
3. Normal siteye gittiğinde admin sidebar/topbar görünmüyor mu?
4. Ana sayfada video doğru boyutta mı (60vh)?
5. Arama formu videonun ALTINDA mı duruyor?
6. Takvim tıklanınca düzgün açılıyor mu, arkada kalmıyor mu?
7. Mobilde form dikey düzende mi?
