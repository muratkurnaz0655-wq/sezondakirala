# SezondalKirala — Admin Panel Yeniden Tasarım Promptu

`/yonetim` altındaki tüm sayfalar tamamen yeniden tasarlanacak. Normal site tasarımından (beyaz, açık) tamamen farklı, koyu ve premium bir görünüm. Aynı Next.js projesi içinde kalıyor, ayrı bir layout kullanılıyor.

---

## BÖLÜM 1 — ADMIN LAYOUT AYIRIMI

### 1.1 Admin layout oluştur
`app/yonetim/layout.tsx` dosyasını tamamen yeniden yaz. Bu layout normal site header/footer'ını kullanmaz, kendi sidebar + topbar sistemine sahip.

```tsx
// app/yonetim/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/yonetim/giris')

  const { data: kullanici } = await supabase
    .from('kullanicilar')
    .select('rol, ad_soyad, email')
    .eq('id', user.id)
    .single()

  if (kullanici?.rol !== 'admin') redirect('/')

  return (
    <div className="admin-layout min-h-screen" style={{
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)'
    }}>
      <AdminSidebar />
      <div className="admin-content" style={{ marginLeft: '260px' }}>
        <AdminTopbar kullanici={kullanici} />
        <main className="p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 1.2 Admin CSS değişkenleri
`globals.css`'e ekle:
```css
/* Admin Panel Tema */
.admin-layout {
  --admin-bg: #0a0a1a;
  --admin-sidebar-bg: rgba(255,255,255,0.03);
  --admin-card-bg: rgba(255,255,255,0.05);
  --admin-card-border: rgba(255,255,255,0.08);
  --admin-text: #e2e8f0;
  --admin-text-muted: #64748b;
  --admin-primary: #0EA5E9;
  --admin-primary-glow: rgba(14,165,233,0.3);
  --admin-secondary: #22C55E;
  --admin-accent: #8B5CF6;
  --admin-danger: #EF4444;
  --admin-warning: #F59E0B;
  font-family: 'Inter', sans-serif;
}

.admin-card {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-card-border);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.2s;
}

.admin-card:hover {
  background: rgba(255,255,255,0.07);
  border-color: rgba(255,255,255,0.12);
}
```

---

## BÖLÜM 2 — GİRİŞ SAYFASI

### 2.1 /yonetim/giris — premium koyu tasarım
```tsx
// app/yonetim/giris/page.tsx
// Bu sayfa admin layout'u kullanmaz (ayrı)
export default function AdminGiris() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)' }}>
      
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Büyük mavi blur daire — sol üst */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: '#0EA5E9', filter: 'blur(100px)' }} />
        {/* Yeşil blur daire — sağ alt */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: '#22C55E', filter: 'blur(120px)' }} />
        {/* Mor accent — orta */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10"
          style={{ background: '#8B5CF6', filter: 'blur(80px)' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

      {/* Login kartı */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #22C55E)' }}>
              SK
            </div>
            <span className="text-2xl font-bold text-white">SezondalKirala</span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-4">Admin Panel</h1>
          <p className="text-gray-400 mt-2">Yönetim paneline erişmek için giriş yapın</p>
        </div>

        {/* Form kartı */}
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
          
          <AdminLoginForm />
        </div>

        {/* Alt link */}
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
// components/admin/AdminLoginForm.tsx
'use client'
export function AdminLoginForm() {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          E-posta
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="email"
            placeholder="admin@sezondakirala.com"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder-gray-600 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onFocus={e => e.target.style.borderColor = '#0EA5E9'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Şifre
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type={sifreGoster ? 'text' : 'password'}
            placeholder="••••••••"
            className="w-full pl-11 pr-11 py-3.5 rounded-xl text-white placeholder-gray-600 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <button type="button" onClick={() => setSifreGoster(!sifreGoster)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {sifreGoster ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {hata && (
        <div className="mb-4 px-4 py-3 rounded-xl text-red-400 text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={14} /> {hata}
        </div>
      )}

      <button type="submit" disabled={yukleniyor}
        className="w-full py-3.5 rounded-xl font-semibold text-white transition-all
          disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #0EA5E9 0%, #22C55E 100%)',
          boxShadow: '0 4px 20px rgba(14,165,233,0.3)'
        }}>
        {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  )
}
```

---

## BÖLÜM 3 — ADMIN SIDEBAR

```tsx
// components/admin/AdminSidebar.tsx
'use client'
import { usePathname } from 'next/navigation'

const menuItems = [
  { href: '/yonetim', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/yonetim/ilanlar', label: 'İlanlar', icon: Home, badge: 'bekleyen' },
  { href: '/yonetim/rezervasyonlar', label: 'Rezervasyonlar', icon: Calendar },
  { href: '/yonetim/paketler', label: 'Paketler', icon: Package },
  { href: '/yonetim/kullanicilar', label: 'Kullanıcılar', icon: Users },
  { href: '/yonetim/ayarlar', label: 'Ayarlar', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-30"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)'
      }}>
      
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #22C55E)' }}>
            SK
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">SezondalKirala</div>
            <div className="text-gray-500 text-xs mt-0.5">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(({ href, label, icon: Icon, exact, badge }) => {
          const aktif = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative"
              style={{
                background: aktif ? 'rgba(14,165,233,0.15)' : 'transparent',
                border: aktif ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
              }}>
              <Icon size={18} style={{ color: aktif ? '#0EA5E9' : '#64748b' }} />
              <span className="text-sm font-medium" style={{ color: aktif ? '#e2e8f0' : '#64748b' }}>
                {label}
              </span>
              {/* Aktif indicator */}
              {aktif && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full"
                  style={{ background: '#0EA5E9' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Alt kısım */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <a href="/" target="_blank"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all
            hover:bg-white/5 text-gray-500 hover:text-gray-300 text-sm">
          <ExternalLink size={16} />
          Siteyi Görüntüle
        </a>
        <button onClick={handleCikis}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
            hover:bg-red-500/10 text-gray-500 hover:text-red-400 text-sm mt-1">
          <LogOut size={16} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
```

---

## BÖLÜM 4 — ADMIN TOPBAR

```tsx
// components/admin/AdminTopbar.tsx
export function AdminTopbar({ kullanici }: { kullanici: any }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(10,10,26,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)'
      }}>
      
      {/* Sayfa başlığı — dinamik */}
      <div>
        <h1 className="text-white font-bold text-lg" id="admin-page-title">Dashboard</h1>
        <p className="text-gray-500 text-xs mt-0.5">SezondalKirala Yönetim Paneli</p>
      </div>

      {/* Sağ taraf */}
      <div className="flex items-center gap-4">
        {/* Bildirimler */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center
          hover:bg-white/5 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <Bell size={16} className="text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full" />
        </button>

        {/* Kullanıcı */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #0EA5E9, #22C55E)' }}>
            {kullanici?.ad_soyad?.[0] ?? 'A'}
          </div>
          <div className="hidden md:block">
            <div className="text-white text-sm font-medium leading-none">
              {kullanici?.ad_soyad ?? 'Admin'}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">Yönetici</div>
          </div>
        </div>
      </div>
    </header>
  )
}
```

---

## BÖLÜM 5 — DASHBOARD (/yonetim)

```tsx
// app/yonetim/page.tsx
export default async function AdminDashboard() {
  // İstatistikleri çek
  const [ilanlar, rezervasyonlar, kullanicilar, bekleyen] = await Promise.all([
    supabase.from('ilanlar').select('id', { count: 'exact' }),
    supabase.from('rezervasyonlar').select('id', { count: 'exact' }),
    supabase.from('kullanicilar').select('id', { count: 'exact' }),
    supabase.from('ilanlar').select('id', { count: 'exact' }).eq('aktif', false),
  ])

  const stats = [
    { label: 'Toplam İlan', value: ilanlar.count ?? 0, icon: Home, color: '#0EA5E9', change: '+3 bu ay' },
    { label: 'Rezervasyon', value: rezervasyonlar.count ?? 0, icon: Calendar, color: '#22C55E', change: '+12 bu hafta' },
    { label: 'Kullanıcı', value: kullanicilar.count ?? 0, icon: Users, color: '#8B5CF6', change: '+5 bu ay' },
    { label: 'Onay Bekleyen', value: bekleyen.count ?? 0, icon: Clock, color: '#F59E0B', change: 'İnceleme gerekli', urgent: true },
  ]

  return (
    <div>
      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, change, urgent }) => (
          <div key={label} className="admin-card p-5 relative overflow-hidden">
            {/* Arka plan glow */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6"
              style={{ background: color, filter: 'blur(20px)' }} />
            
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                <Icon size={20} style={{ color }} />
              </div>
              {urgent && value > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                  Acil
                </span>
              )}
            </div>
            
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-gray-400 text-sm mb-2">{label}</div>
            <div className="text-xs" style={{ color: urgent && value > 0 ? '#F59E0B' : '#64748b' }}>
              {change}
            </div>
          </div>
        ))}
      </div>

      {/* Son aktivite + Onay bekleyenler */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Onay bekleyen ilanlar */}
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">⏳ Onay Bekleyen İlanlar</h3>
            <Link href="/yonetim/ilanlar?filtre=bekleyen"
              className="text-sky-400 hover:text-sky-300 text-sm transition-colors">
              Tümünü Gör →
            </Link>
          </div>
          <BekleyenIlanlar />
        </div>

        {/* Son rezervasyonlar */}
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">📅 Son Rezervasyonlar</h3>
            <Link href="/yonetim/rezervasyonlar"
              className="text-sky-400 hover:text-sky-300 text-sm transition-colors">
              Tümünü Gör →
            </Link>
          </div>
          <SonRezervasyonlar />
        </div>
      </div>
    </div>
  )
}
```

---

## BÖLÜM 6 — ADMIN SAYFALARI ORTAK KOMPONENT STİLLERİ

Tüm `/yonetim` alt sayfalarında kullanılacak stiller:

```tsx
// Admin tablo stili
<div className="admin-card overflow-hidden">
  <table className="w-full">
    <thead>
      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Başlık
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="transition-colors hover:bg-white/5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <td className="px-5 py-4 text-gray-300 text-sm">İçerik</td>
      </tr>
    </tbody>
  </table>
</div>

// Admin buton stilleri
.admin-btn-primary {
  background: linear-gradient(135deg, #0EA5E9, #0284C7);
  color: white;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(14,165,233,0.25);
}

.admin-btn-success {
  background: linear-gradient(135deg, #22C55E, #16A34A);
  box-shadow: 0 4px 12px rgba(34,197,94,0.25);
}

.admin-btn-danger {
  background: linear-gradient(135deg, #EF4444, #DC2626);
  box-shadow: 0 4px 12px rgba(239,68,68,0.25);
}

// Admin badge stilleri
.admin-badge-beklemede { background: rgba(245,158,11,0.15); color: #F59E0B; border: 1px solid rgba(245,158,11,0.3); }
.admin-badge-onaylandi { background: rgba(34,197,94,0.15); color: #22C55E; border: 1px solid rgba(34,197,94,0.3); }
.admin-badge-iptal { background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid rgba(239,68,68,0.3); }

// Admin input
.admin-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 10px 14px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}
.admin-input:focus { border-color: #0EA5E9; }
.admin-input::placeholder { color: #475569; }
```

---

## BÖLÜM 7 — TÜM /yonetim SAYFALARI YENİDEN YAZ

Aşağıdaki sayfaların içeriğini admin temasına uygun olarak yeniden yaz. Her sayfa `admin-card`, `admin-input`, `admin-btn-*` sınıflarını kullanacak. Koyu arka plan üzerinde beyaz/gri metin.

### /yonetim/ilanlar
- Tablo: admin tablo stili
- Filtre tabları: Tümü | Onay Bekleyen | Yayında | Reddedildi — her biri admin badge rengiyle
- Onayla/Reddet butonları: admin-btn-success / admin-btn-danger
- İlan görseli küçük thumbnail olarak tabloda

### /yonetim/rezervasyonlar
- Tablo: referans no, kullanıcı, ilan, tarihler, tutar, durum badge
- Durum değiştir dropdown: admin styled select
- Tarih filtresi: admin-input

### /yonetim/kullanicilar
- Tablo: avatar (baş harf), ad, email, rol badge, kayıt tarihi
- Rol değiştir: inline select, admin styled
- Arama: admin-input

### /yonetim/paketler
- Paket oluşturma formu: admin-input, admin-card
- İlan seçici: checkboxlar, koyu stilli

### /yonetim/ayarlar
- Form kartları: admin-card içinde gruplandırılmış
- Kaydet butonu: admin-btn-primary

### /yonetim/ilanlar/[id]/takvim
- Takvim: koyu arka plan üzerinde (Bölüm 3'teki mantıkla ama admin temasında)
- Dolu günler: kırmızı glow efekti
- Müsait günler: yeşil tint
- İşlem butonları: admin-btn-* stilleriyle

---

## BÖLÜM 8 — MOBİL ADMIN

Admin paneli masaüstü öncelikli ama mobilde de çalışmalı:

```tsx
// Mobilde sidebar gizle, hamburger ekle
<button className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-xl
  flex items-center justify-center"
  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
  onClick={() => setSidebarAcik(!sidebarAcik)}>
  <Menu size={18} className="text-white" />
</button>

// Mobilde content margin kaldır
<div className="md:ml-64">
  {children}
</div>
```

---

## SONUNDA

```bash
npm run build && npm run lint
```

Test:
1. `/yonetim/giris` — koyu tema, gradient buton görünüyor mu?
2. Giriş sonrası sidebar solda, topbar üstte görünüyor mu?
3. Normal site (`/`, `/konaklama`) admin temasından etkilenmiyor mu?
4. Dashboard istatistik kartları mavi/yeşil glow ile görünüyor mu?
5. İlan tablosu koyu arka plan üzerinde okunuyor mu?
6. Onayla/Reddet butonları çalışıyor mu?
7. Takvim sayfasında tarih seçip kaydetme çalışıyor mu?
8. Mobilde hamburger menü çalışıyor mu?
