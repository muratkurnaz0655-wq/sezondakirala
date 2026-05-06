# SezondalKirala — V10 Video, Filtre & Tasarım Düzeltme Promptu

---

## BÖLÜM 1 — MOBİL VİDEO SORUNU (KRİTİK)

Video mobilde hiç görünmüyor. Bunun tek nedeni iOS Safari'nin `autoPlay` kısıtlaması.

### 1.1 HeroVideo — Client Component olarak yeniden yaz

```tsx
// components/HeroVideo.tsx
'use client'
import { useEffect, useRef, useState } from 'react'

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // iOS Safari için manuel play
    const tryPlay = async () => {
      try {
        video.muted = true // Programatik olarak da set et
        await video.play()
      } catch {
        setFallback(true)
      }
    }

    // Sayfa yüklenince dene
    if (video.readyState >= 2) {
      tryPlay()
    } else {
      video.addEventListener('loadeddata', tryPlay, { once: true })
    }

    // Hata durumunda fallback
    video.addEventListener('error', () => setFallback(true), { once: true })
  }, [])

  if (fallback) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 40%, #166534 100%)',
        }}
      />
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      className="absolute inset-0 w-full h-full object-cover object-center"
      style={{ WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
    >
      <source src="/videos/video.mp4" type="video/mp4" />
    </video>
  )
}
```

### 1.2 next.config.js — video streaming header ekle

```js
async headers() {
  return [
    {
      source: '/videos/:path*',
      headers: [
        { key: 'Accept-Ranges', value: 'bytes' },
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ]
},
```

`Accept-Ranges: bytes` olmadan iOS video yükleyemiyor.

---

## BÖLÜM 2 — HERO VİDEO BOYUTU — DAHA NAZIK

Video şu an tüm ekranı kaplıyor. Daha küçük ve zarif:

```tsx
// Hero section
<section
  className="relative w-full overflow-hidden"
  style={{ height: '70vh', minHeight: '500px', maxHeight: '680px' }}
>
  {/* Video wrapper — sadece burada overflow-hidden */}
  <div className="absolute inset-0 overflow-hidden">
    <HeroVideo />
    {/* Gradient overlay */}
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.75) 100%)',
      }}
    />
  </div>

  {/* İçerik */}
  <div
    className="relative h-full flex flex-col items-center justify-center px-4 text-center"
    style={{ zIndex: 10 }}
  >
    {/* başlık, form vb */}
  </div>
</section>
```

**Mobil:**
```css
@media (max-width: 768px) {
  .hero-section {
    height: 55vh !important;
    min-height: 420px !important;
    max-height: 560px !important;
  }
}
```

---

## BÖLÜM 3 — MOBİL HAMBURGER MENÜ SORUNU

Şu an 3 çizgiye tıklayınca giriş/kayıt butonları iç içe geçmiş görünüyor.

### 3.1 Mobile drawer — tamamen yeniden yaz

```tsx
// components/MobileMenu.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Building2, Sailboat, Package, Info, HelpCircle, LogIn, UserPlus } from 'lucide-react'

export function MobileMenu({ user }: { user: any }) {
  const [acik, setAcik] = useState(false)

  const navLinks = [
    { href: '/', label: 'Ana Sayfa', icon: Home },
    { href: '/konaklama', label: 'Konaklama', icon: Building2 },
    { href: '/tekneler', label: 'Tekneler', icon: Sailboat },
    { href: '/paketler', label: 'Paketler', icon: Package },
    { href: '/hakkimizda', label: 'Hakkımızda', icon: Info },
    { href: '/sss', label: 'SSS', icon: HelpCircle },
  ]

  return (
    <>
      {/* Hamburger butonu */}
      <button
        onClick={() => setAcik(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl
          hover:bg-white/10 transition-colors"
        aria-label="Menüyü aç"
      >
        <Menu size={22} className="text-white" />
      </button>

      {/* Overlay */}
      {acik && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setAcik(false)}
        />
      )}

      {/* Drawer — sağdan kayar */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-white z-50
          flex flex-col shadow-2xl transition-transform duration-300 ease-out md:hidden
          ${acik ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center
              text-white font-bold text-sm">
              SK
            </div>
            <span className="font-bold text-gray-900">SezondalKirala</span>
          </div>
          <button
            onClick={() => setAcik(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Nav linkleri */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setAcik(false)}
              className="flex items-center gap-3 px-5 py-3.5 text-gray-700
                hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <Icon size={18} className="text-gray-400 flex-shrink-0" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Alt kısım — auth butonları */}
        <div className="px-5 py-5 border-t border-gray-100 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-sky-500 rounded-full flex items-center
                  justify-center text-white font-bold text-sm flex-shrink-0">
                  {(user.ad_soyad?.[0] ?? user.email?.[0] ?? 'K').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {user.ad_soyad ?? user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{user.email}</div>
                </div>
              </div>
              <Link
                href="/panel/rezervasyonlar"
                onClick={() => setAcik(false)}
                className="flex items-center justify-center w-full py-3 rounded-xl
                  border border-gray-200 text-gray-700 font-medium text-sm
                  hover:bg-gray-50 transition-colors"
              >
                Rezervasyonlarım
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/giris"
                onClick={() => setAcik(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                  border border-gray-200 text-gray-700 font-semibold text-sm
                  hover:bg-gray-50 transition-colors"
              >
                <LogIn size={16} />
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                onClick={() => setAcik(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                  bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm
                  transition-colors"
              >
                <UserPlus size={16} />
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
```

---

## BÖLÜM 4 — FİLTRELEME — TAMAMEN YENİDEN YAZ

### 4.1 Villa ve Tekne filtreleri ayrı olmalı

**Villa filtreleri** (`/konaklama`):
- Fiyat aralığı
- Kapasite (kişi sayısı)
- Yatak odası sayısı
- Konum (Ölüdeniz, Çalış, Göcek, Hisarönü, Kayaköy, Fethiye Merkez)
- Özellikler: Özel Havuz, WiFi, Klima, Deniz Manzarası, Bahçe, BBQ, Jakuzi, Evcil Hayvan

**Tekne filtreleri** (`/tekneler`):
- Fiyat aralığı
- Kapasite (kişi sayısı)
- Tekne tipi (Gület, Sürat Teknesi, Yelkenli, Katamaran)
- Özellikler: WiFi, Klima, Kabin, Jeneratör, Kaptan Dahil

Isıtmalı havuz, jakuzi gibi villa özellikleri tekne filtresinde **kesinlikle olmayacak**.

### 4.2 Filtre sistemi — çalışır implementasyon

```tsx
// components/VillaFiltreSidebar.tsx
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function VillaFiltreSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // URL parametresini güncelle
  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('sayfa') // filtre değişince 1. sayfaya dön
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, searchParams, pathname])

  const temizle = () => router.push(pathname, { scroll: false })

  const aktifSayisi = [...searchParams.entries()]
    .filter(([k]) => k !== 'sayfa' && k !== 'siralama')
    .length

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">

        {/* Başlık */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Filtreler</h3>
          {aktifSayisi > 0 && (
            <button
              onClick={temizle}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium"
            >
              Temizle ({aktifSayisi})
            </button>
          )}
        </div>

        {/* Fiyat */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 block mb-2">
            Gecelik Fiyat (₺)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={searchParams.get('fiyat_min') ?? ''}
              onBlur={e => setParam('fiyat_min', e.target.value || null)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:border-sky-400"
            />
            <input
              type="number"
              placeholder="Max"
              defaultValue={searchParams.get('fiyat_max') ?? ''}
              onBlur={e => setParam('fiyat_max', e.target.value || null)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Kapasite */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Kapasite</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '2 kişi', val: '2' },
              { label: '4 kişi', val: '4' },
              { label: '6 kişi', val: '6' },
              { label: '8+ kişi', val: '8' },
            ].map(({ label, val }) => {
              const aktif = searchParams.get('kapasite') === val
              return (
                <button
                  key={val}
                  onClick={() => setParam('kapasite', aktif ? null : val)}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all
                    ${aktif
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Konum */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Bölge</label>
          <div className="space-y-2">
            {['Ölüdeniz', 'Çalış', 'Göcek', 'Hisarönü', 'Kayaköy', 'Fethiye Merkez'].map(bolge => {
              const aktif = searchParams.get('konum') === bolge
              return (
                <label key={bolge} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={aktif}
                    onChange={() => setParam('konum', aktif ? null : bolge)}
                    className="w-4 h-4 rounded border-gray-300 text-sky-500
                      focus:ring-sky-400 cursor-pointer"
                  />
                  <span className={`text-sm transition-colors
                    ${aktif ? 'text-sky-700 font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>
                    {bolge}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Villa Özellikleri */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Özellikler</label>
          <div className="space-y-2">
            {[
              { key: 'havuz', label: '🏊 Özel Havuz' },
              { key: 'wifi', label: '📶 WiFi' },
              { key: 'klima', label: '❄️ Klima' },
              { key: 'deniz_manzarasi', label: '🌊 Deniz Manzarası' },
              { key: 'bahce', label: '🌿 Bahçe' },
              { key: 'bbq', label: '🔥 BBQ / Mangal' },
              { key: 'jakuzi', label: '🛁 Jakuzi' },
              { key: 'evcil_hayvan', label: '🐾 Evcil Hayvan' },
            ].map(({ key, label }) => {
              const aktif = searchParams.get(key) === 'true'
              return (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={aktif}
                    onChange={() => setParam(key, aktif ? null : 'true')}
                    className="w-4 h-4 rounded border-gray-300 text-sky-500
                      focus:ring-sky-400 cursor-pointer"
                  />
                  <span className={`text-sm transition-colors
                    ${aktif ? 'text-sky-700 font-medium' : 'text-gray-700'}`}>
                    {label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Sıralama */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Sıralama</label>
          <select
            value={searchParams.get('siralama') ?? 'onerilen'}
            onChange={e => setParam('siralama', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
              bg-white focus:outline-none focus:border-sky-400"
          >
            <option value="onerilen">Önerilen</option>
            <option value="fiyat_artan">Fiyat (Artan)</option>
            <option value="fiyat_azalan">Fiyat (Azalan)</option>
            <option value="en_yeni">En Yeni</option>
          </select>
        </div>
      </div>
    </aside>
  )
}
```

```tsx
// components/TekneFiltreSidebar.tsx — Sadece tekneye özel filtreler
'use client'
// Aynı yapı, sadece özellikler farklı:
// Villa özelliklerini (havuz, jakuzi, bahçe vb.) KALDIR
// Tekne özelliklerini ekle:
const tekneOzellikleri = [
  { key: 'wifi', label: '📶 WiFi' },
  { key: 'klima', label: '❄️ Klima' },
  { key: 'kabin', label: '🛏️ Özel Kabin' },
  { key: 'kaptan_dahil', label: '👨‍✈️ Kaptan Dahil' },
  { key: 'generator', label: '⚡ Jeneratör' },
  { key: 'gunes_teknesi', label: '☀️ Güneş Teknesi' },
]
// Konum filtresi tekne için: Marina, Ölüdeniz İskelesi, Göcek Marina
```

### 4.3 Supabase filtre sorgusu — çalışır hale getir

```tsx
// app/konaklama/page.tsx
export default async function KonaklamaSayfasi({
  searchParams,
}: {
  searchParams: { [key: string]: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('ilanlar')
    .select('*, ilan_medyalari(url, sira)')
    .eq('aktif', true)
    .eq('tip', 'villa')

  // Fiyat filtresi
  if (searchParams.fiyat_min) {
    query = query.gte('gunluk_fiyat', Number(searchParams.fiyat_min))
  }
  if (searchParams.fiyat_max) {
    query = query.lte('gunluk_fiyat', Number(searchParams.fiyat_max))
  }

  // Kapasite filtresi
  if (searchParams.kapasite) {
    query = query.gte('kapasite', Number(searchParams.kapasite))
  }

  // Konum filtresi
  if (searchParams.konum) {
    query = query.ilike('konum', `%${searchParams.konum}%`)
  }

  // Özellik filtreleri — ozellikler jsonb kolonu
  const ozellikFiltreler = ['havuz', 'wifi', 'klima', 'deniz_manzarasi', 'bahce', 'bbq', 'jakuzi', 'evcil_hayvan']
  for (const ozellik of ozellikFiltreler) {
    if (searchParams[ozellik] === 'true') {
      query = query.eq(`ozellikler->${ozellik}`, true)
    }
  }

  // Sıralama
  switch (searchParams.siralama) {
    case 'fiyat_artan':
      query = query.order('gunluk_fiyat', { ascending: true })
      break
    case 'fiyat_azalan':
      query = query.order('gunluk_fiyat', { ascending: false })
      break
    case 'en_yeni':
      query = query.order('olusturulma_tarihi', { ascending: false })
      break
    default:
      query = query.order('sponsorlu', { ascending: false })
  }

  const { data: ilanlar } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        <VillaFiltreSidebar />
        <div className="flex-1">
          {/* Aktif filtre bandı */}
          <AktifFiltreBandi searchParams={searchParams} />
          {/* Sonuç sayısı */}
          <p className="text-gray-500 text-sm mb-4">
            <span className="font-semibold text-gray-900">{ilanlar?.length ?? 0}</span> villa bulundu
          </p>
          {/* İlan grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ilanlar?.map(ilan => <VillaKart key={ilan.id} ilan={ilan} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
```

Aynı mantığı `app/tekneler/page.tsx` için de uygula, `tip = 'tekne'` ve `TekneFiltreSidebar` kullan.

### 4.4 Mobilde filtre — bottom sheet

```tsx
// Mobilde filtre butonu + bottom sheet
<div className="md:hidden flex items-center gap-2 mb-4">
  <button
    onClick={() => setFiltrePaneliAcik(true)}
    className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5
      text-sm font-medium text-gray-700 bg-white shadow-sm"
  >
    <SlidersHorizontal size={16} />
    Filtrele
    {aktifFiltreSayisi > 0 && (
      <span className="bg-sky-500 text-white text-xs rounded-full w-5 h-5
        flex items-center justify-center">
        {aktifFiltreSayisi}
      </span>
    )}
  </button>
</div>

{/* Bottom sheet */}
{filtrePaneliAcik && (
  <>
    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setFiltrePaneliAcik(false)} />
    <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50
      max-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-bold text-gray-900">Filtreler</h3>
        <button onClick={() => setFiltrePaneliAcik(false)}>
          <X size={20} className="text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {/* filtre içeriği */}
      </div>
      <div className="p-4 border-t flex gap-3">
        <button onClick={temizle}
          className="flex-1 py-3 rounded-xl border border-gray-200 font-medium text-sm">
          Temizle
        </button>
        <button onClick={() => setFiltrePaneliAcik(false)}
          className="flex-1 py-3 rounded-xl bg-sky-500 text-white font-semibold text-sm">
          Uygula
        </button>
      </div>
    </div>
  </>
)}
```

---

## BÖLÜM 5 — GENEL TASARIM İYİLEŞTİRME

### 5.1 globals.css — temel stil sistemi

```css
/* globals.css */

/* Font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #f8fafc;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
}

/* Kart */
.card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

/* Butonlar */
.btn-primary {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.45);
  transform: translateY(-1px);
}

.btn-secondary {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);
}

.btn-outline {
  background: white;
  color: #374151;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 11px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover {
  border-color: #0ea5e9;
  color: #0ea5e9;
  background: #eff6ff;
}

/* Input */
.form-input {
  width: 100%;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  background: white;
  transition: all 0.2s;
  outline: none;
}
.form-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

/* Badge */
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 99px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  gap: 4px;
}
.badge-blue { background: #dbeafe; color: #1d4ed8; }
.badge-green { background: #dcfce7; color: #166534; }
.badge-amber { background: #fef3c7; color: #92400e; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-purple { background: #ede9fe; color: #6d28d9; }

/* Section spacing */
.section { padding: 80px 0; }
.section-sm { padding: 48px 0; }
.container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

/* Bölüm başlığı */
.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.section-subtitle {
  font-size: 16px;
  color: #64748b;
  margin-top: 8px;
}

/* Wave divider */
.wave-divider svg { display: block; }

/* Shimmer skeleton */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

/* Mobil dokunma hedefleri */
@media (max-width: 768px) {
  button, a, input, select {
    min-height: 44px;
    touch-action: manipulation;
  }
  input, select, textarea {
    font-size: 16px !important; /* iOS zoom önle */
  }
}
```

### 5.2 Ana sayfa section'ları — arka plan renk sistemi

```tsx
// Bölümler arasında dönüşümlü arka planlar:
// 1. Hero: koyu (video)
// 2. İstatistik bandı: beyaz
// 3. Paketler: #f0fdf4 (hafif yeşil)
// 4. Kategoriler: beyaz
// 5. Villalar: #f8fafc (hafif gri)
// 6. Nasıl Çalışır: #eff6ff (hafif mavi)
// 7. Yorumlar: beyaz
// 8. Bölgeler: #0f172a (koyu)
// 9. CTA: gradient mavi-yeşil
// 10. Footer: #0f172a (koyu)
```

### 5.3 Villa kartı — profesyonel görünüm

```tsx
// components/VillaKart.tsx — tamamen yeniden yaz
export function VillaKart({ ilan, geceSayisi }: { ilan: Ilan; geceSayisi?: number }) {
  const kapak = ilan.ilan_medyalari
    ?.sort((a, b) => a.sira - b.sira)[0]?.url
    ?? 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'

  const fiyatGoster = geceSayisi
    ? `₺${((ilan.gunluk_fiyat * geceSayisi) + ilan.temizlik_ucreti).toLocaleString('tr-TR')} toplam`
    : `₺${ilan.gunluk_fiyat.toLocaleString('tr-TR')} / gece`

  return (
    <Link href={`/${ilan.tip === 'villa' ? 'konaklama' : 'tekneler'}/${ilan.slug ?? ilan.id}`}
      className="card group block">
      {/* Görsel */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={kapak}
          alt={ilan.baslik}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Üst rozetler */}
        <div className="absolute top-3 left-3">
          {ilan.sponsorlu && (
            <span className="badge badge-amber">⭐ Öne Çıkan</span>
          )}
        </div>
        {/* Favori butonu */}
        <button
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm
            rounded-full flex items-center justify-center shadow-md
            hover:bg-white transition-all hover:scale-110"
          onClick={e => { e.preventDefault(); /* favori ekle */ }}
        >
          <Heart size={16} className="text-gray-400" />
        </button>
      </div>

      {/* İçerik */}
      <div className="p-4">
        {/* Konum */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
          <MapPin size={11} />
          {ilan.konum}
        </div>
        {/* Başlık */}
        <h3 className="font-semibold text-gray-900 text-[15px] leading-snug
          line-clamp-1 mb-2.5">
          {ilan.baslik}
        </h3>
        {/* Özellikler */}
        <div className="flex items-center gap-3 text-xs text-gray-500 pb-3
          border-b border-gray-100 mb-3">
          <span className="flex items-center gap-1">
            <Bed size={13} /> {ilan.yatak_odasi} oda
          </span>
          <span className="flex items-center gap-1">
            <Bath size={13} /> {ilan.banyo} banyo
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} /> {ilan.kapasite} kişi
          </span>
        </div>
        {/* Fiyat */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900 text-[15px]">{fiyatGoster}</span>
            {geceSayisi && (
              <div className="text-xs text-gray-400 mt-0.5">
                ₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}/gece
              </div>
            )}
          </div>
          <span className="text-xs text-sky-600 font-medium group-hover:underline">
            İncele →
          </span>
        </div>
      </div>
    </Link>
  )
}
```

---

## BÖLÜM 6 — HER SAYFADA TEKRAR EDEN SORUNLAR

### 6.1 Tüm sayfalarda sayfa başlığı section'ı ekle
`/konaklama`, `/tekneler`, `/paketler`, `/hakkimizda`, `/sss` sayfalarına:
```tsx
<div className="bg-gradient-to-br from-sky-50 to-blue-50 border-b border-sky-100">
  <div className="container py-10">
    <nav className="text-xs text-gray-400 mb-2 flex items-center gap-1">
      <Link href="/" className="hover:text-gray-600">Ana Sayfa</Link>
      <ChevronRight size={12} />
      <span className="text-gray-600">Konaklama</span>
    </nav>
    <h1 className="section-title">Fethiye Villa Kiralama</h1>
    <p className="section-subtitle">50+ onaylı villa ile hayalinizdeki tatili bulun</p>
  </div>
</div>
```

### 6.2 Boş durum görseli
İlan bulunamazsa:
```tsx
{ilanlar?.length === 0 && (
  <div className="text-center py-20">
    <div className="text-6xl mb-4">🏠</div>
    <h3 className="font-bold text-xl text-gray-900 mb-2">İlan bulunamadı</h3>
    <p className="text-gray-500 mb-6">Filtrelerinizi değiştirmeyi deneyin</p>
    <button onClick={temizle} className="btn-outline">Filtreleri Temizle</button>
  </div>
)}
```

### 6.3 Loading skeleton
Data yüklenirken:
```tsx
function VillaKartSkeleton() {
  return (
    <div className="card">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded mt-3" />
      </div>
    </div>
  )
}
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test listesi:
1. Mobilde ana sayfada video görünüyor mu?
2. Hero video yüksekliği 70vh — çok büyük değil mi?
3. Mobilde hamburger açıldığında drawer düzgün görünüyor mu?
4. /konaklama — konum filtresi seçince URL değişiyor mu, ilanlar filtreleniyor mu?
5. /tekneler — villa özellikleri (havuz, jakuzi) yok, sadece tekne özellikleri var mı?
6. Filtre temizle butonu çalışıyor mu?
7. Villa kartları hover'da yukarı kalkıyor mu?
8. Sayfa arka planları dönüşümlü renklerde mi?

---

## BÖLÜM 7 — FOOTER HİZMETLER BÖLÜMÜ

### 7.1 Hizmetler linkleri tıklanabilir değil — düzelt

Footer'daki "Hizmetler" başlığı altındaki tüm öğeler plain text olarak yazılmış, Link değil. Hepsini ilgili sayfalara yönlendir:

```tsx
// components/Footer.tsx — Hizmetler kolonu
<div>
  <h4 className="font-semibold text-white mb-4">Hizmetler</h4>
  <ul className="space-y-2.5">
    {[
      { label: 'Villa Kiralama', href: '/konaklama' },
      { label: 'Tekne Kiralama', href: '/tekneler' },
      { label: 'Tatil Paketleri', href: '/paketler' },
      { label: 'Özel Turlar', href: '/paketler?kategori=macera' },
      { label: 'Transfer Hizmeti', href: '/iletisim' },
      { label: 'Havalimanı Karşılama', href: '/iletisim' },
    ].map(({ label, href }) => (
      <li key={label}>
        <Link
          href={href}
          className="text-gray-400 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block"
        >
          {label}
        </Link>
      </li>
    ))}
  </ul>
</div>
```

### 7.2 Footer tüm linkleri kontrol et

Hızlı Linkler, Hizmetler ve İletişim kolonlarındaki tüm öğeleri gözden geçir:
- plain text olanları Link ile sar
- href="#" olan placeholder linkleri gerçek sayfa yollarıyla değiştir
- Sosyal medya linkleri href="#" kalabilir ama target="_blank" ekle

Test: Footer'da Hizmetler linkleri tıklanabiliyor mu, doğru sayfalara gidiyor mu?
