# SezondalKirala — V7 Kapsamlı Geliştirme Promptu

Aşağıdaki tüm değişiklikleri sırayla uygula. Her bölüm sonrası `npm run build` al.

---

## BÖLÜM 0 — KRİTİK BUG'LAR (İLK ÖNCE)

### 0.1 onClick Server Component hatası
`app/page.tsx` içinde `onClick`, `onKeyDown` gibi event handler'lar doğrudan Server Component'e geçirilmiş. Şunu yap:

Ana sayfadaki tüm interaktif bileşenleri Client Component'e taşı:
```
components/HomeKategoriFiltre.tsx  → 'use client'
components/HomePaketFiltreler.tsx  → 'use client'  
components/HomeFavoriButon.tsx     → 'use client'
components/HomeAramaFormu.tsx      → 'use client'
```

`app/page.tsx` Server Component olarak kalır, sadece veri çeker. Interaktif kısımları bu Client Component'lere devreder.

### 0.2 Hero video tam ekran sorunu
Video hero alanına sığmıyor. Şu yapıyı kullan:

```tsx
// app/page.tsx — Hero bölümü
<section className="relative w-screen h-screen min-h-[600px] max-h-[100dvh]">
  {/* Video sadece kendi wrapper'ında overflow-hidden */}
  <div className="absolute inset-0 overflow-hidden">
    <video
      autoPlay loop muted playsInline
      className="absolute inset-0 w-full h-full object-cover"
      style={{ zIndex: 0 }}
    >
      <source src="/videos/video.mp4" type="video/mp4" />
    </video>
    {/* Çok katmanlı gradient */}
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.75) 100%)',
      zIndex: 1
    }} />
  </div>
  
  {/* İçerik — video wrapper'ının dışında, overflow-visible */}
  <div className="relative h-full flex flex-col items-center justify-center px-4 text-center"
    style={{ zIndex: 10 }}>
    {/* Hero içerik */}
  </div>
</section>
```

CSS'e ekle:
```css
/* globals.css */
html, body { overflow-x: hidden; }
.hero-video-section { width: 100vw; margin-left: calc(-50vw + 50%); }
```

### 0.3 Takvim z-index — popup arkada kalıyor
```css
/* globals.css */
.rdp { position: relative !important; z-index: 9999 !important; }
.rdp-months { position: relative !important; z-index: 9999 !important; }
```

```tsx
// Takvim açıldığında portal ile render et veya:
<div className="absolute bg-white rounded-2xl shadow-2xl border z-[9999] mt-2">
  <DayPicker ... />
</div>

// Hero section'ın overflow-hidden'ını kaldır (video wrapper'ına taşı)
// Böylece takvim dropdown hero'nun dışına çıkabilir
```

---

## BÖLÜM 1 — AUTH — KULLANICI GİRİŞ SORUNU

### 1.1 Giriş sonrası header anlık güncellenmüyor
**Sorun:** Kullanıcı giriş yapınca header "Giriş Yap / Kayıt Ol" göstermeye devam ediyor, F5 sonrası düzeliyor.

**Çözüm:** Header'ı Client Component yap ve Supabase `onAuthStateChange` dinle:

```tsx
// components/Header.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // İlk yüklemede session'ı al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Auth değişikliklerini dinle — giriş/çıkış anlık yansır
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <HeaderSkeleton />

  return (
    <header className="...">
      {/* ... nav ... */}
      <div className="flex items-center gap-3">
        {user ? (
          <UserDropdown user={user} />
        ) : (
          <>
            <Link href="/giris">Giriş Yap</Link>
            <Link href="/kayit">Kayıt Ol →</Link>
          </>
        )}
      </div>
    </header>
  )
}
```

### 1.2 UserDropdown — role göre menü
```tsx
// components/UserDropdown.tsx
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function UserDropdown({ user }: { user: User }) {
  const [profil, setProfil] = useState<{ ad_soyad: string; rol: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('kullanicilar')
      .select('ad_soyad, rol')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfil(data))
  }, [user.id])

  const adSoyad = profil?.ad_soyad ?? user.email?.split('@')[0] ?? 'Kullanıcı'
  const bas = adSoyad[0]?.toUpperCase()

  return (
    <div className="relative group">
      {/* Avatar */}
      <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200
        rounded-full pl-2 pr-4 py-1.5 transition-colors">
        <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center
          text-white font-bold text-sm">{bas}</div>
        <span className="text-sm font-medium text-gray-700 hidden md:block">
          {adSoyad.split(' ')[0]}
        </span>
        <ChevronDown size={14} className="text-gray-500" />
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl
        border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100
        group-hover:visible transition-all z-50">
        
        {/* Profil özeti */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="font-semibold text-gray-900 text-sm">{adSoyad}</div>
          <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
        </div>

        {/* Role göre menü */}
        {profil?.rol === 'admin' && (
          <Link href="/yonetim" className="menu-item text-purple-600">
            <Shield size={14} /> Yönetim Paneli
          </Link>
        )}

        {(profil?.rol === 'ilan_sahibi' || profil?.rol === 'admin') && (
          <>
            <Link href="/panel/ilanlarim" className="menu-item">
              <Home size={14} /> İlanlarım
            </Link>
            <Link href="/panel/talepler" className="menu-item">
              <Bell size={14} /> Gelen Talepler
            </Link>
          </>
        )}

        <Link href="/panel/rezervasyonlar" className="menu-item">
          <Calendar size={14} /> Rezervasyonlarım
        </Link>
        <Link href="/panel/favoriler" className="menu-item">
          <Heart size={14} /> Favorilerim
        </Link>
        <Link href="/panel/profil" className="menu-item">
          <User size={14} /> Profil Ayarları
        </Link>

        <div className="border-t border-gray-100 mt-2 pt-2">
          <button onClick={handleCikis} className="menu-item text-red-500 w-full">
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 1.3 Admin paneline girince başka sayfada kullanıcı görünme sorunu
**Sorun:** `/yonetim`'e girince başka bir oturumda (farklı kullanıcıyla) ana sayfada kullanıcı bilgisi görünüyor.

**Çözüm:** Middleware'i güncelle — her request'te session'ı doğru şekilde refresh et:

```tsx
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Session'ı refresh et
  const { data: { user } } = await supabase.auth.getUser()

  // /yonetim route'larını koru
  if (request.nextUrl.pathname.startsWith('/yonetim')) {
    if (!user) {
      return NextResponse.redirect(new URL('/yonetim/giris', request.url))
    }
    // Admin kontrolü
    const { data: kullanici } = await supabase
      .from('kullanicilar')
      .select('rol')
      .eq('id', user.id)
      .single()
    
    if (kullanici?.rol !== 'admin' && !request.nextUrl.pathname.includes('/yonetim/giris')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // /panel route'larını koru
  if (request.nextUrl.pathname.startsWith('/panel')) {
    if (!user) {
      const redirect = encodeURIComponent(request.nextUrl.pathname)
      return NextResponse.redirect(new URL(`/giris?redirect=${redirect}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|videos|images).*)'],
}
```

---

## BÖLÜM 2 — İLAN SAHİBİ PANELİ — TAM YENİDEN YAZ

### 2.1 /panel/ilanlarim/yeni — Wizard tamamen yeniden yaz

**4 adımlı, tam profesyonel wizard:**

**Adım göstergesi:**
```tsx
// Üstte progress bar + adım numaraları
<div className="flex items-center justify-between mb-8">
  {['Temel Bilgiler', 'Fotoğraflar', 'Özellikler & Konum', 'Fiyat & Kurallar'].map((adim, i) => (
    <div key={i} className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
        ${aktifAdim > i + 1 ? 'bg-green-500 text-white' :
          aktifAdim === i + 1 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {aktifAdim > i + 1 ? <Check size={16} /> : i + 1}
      </div>
      <span className={`text-sm hidden md:block ${aktifAdim === i + 1 ? 'font-semibold text-sky-600' : 'text-gray-400'}`}>
        {adim}
      </span>
      {i < 3 && <ChevronRight size={16} className="text-gray-300 mx-2" />}
    </div>
  ))}
</div>
```

**ADIM 1 — Temel Bilgiler:**
```tsx
// İlan türü — büyük seçim kartları
<div className="grid grid-cols-2 gap-4 mb-6">
  <button onClick={() => setTip('villa')}
    className={`p-6 rounded-2xl border-2 text-center transition-all
      ${tip === 'villa' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}>
    <Home size={32} className={tip === 'villa' ? 'text-sky-500' : 'text-gray-400'} />
    <div className="font-semibold mt-2">Villa</div>
    <div className="text-xs text-gray-500 mt-1">Müstakil tatil evi</div>
  </button>
  <button onClick={() => setTip('tekne')}
    className={`p-6 rounded-2xl border-2 text-center transition-all
      ${tip === 'tekne' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}>
    <Sailboat size={32} className={tip === 'tekne' ? 'text-sky-500' : 'text-gray-400'} />
    <div className="font-semibold mt-2">Tekne</div>
    <div className="text-xs text-gray-500 mt-1">Gület, sürat, yelkenli</div>
  </button>
</div>

// Başlık
<div className="mb-4">
  <label className="form-label">İlan Başlığı *</label>
  <input placeholder="Örn: Ölüdeniz Manzaralı Lüks Villa" className="form-input" 
    {...register('baslik', { required: true, minLength: 10 })} />
  {errors.baslik && <span className="form-error">En az 10 karakter giriniz</span>}
</div>

// Açıklama
<div className="mb-4">
  <label className="form-label">Açıklama * <span className="text-gray-400 text-xs">({aciklama.length}/1000)</span></label>
  <textarea rows={5} placeholder="Villanızı detaylı anlatın..." className="form-input resize-none"
    {...register('aciklama', { required: true, minLength: 50 })} />
</div>

// Konum
<div className="mb-4">
  <label className="form-label">Bölge *</label>
  <select className="form-input" {...register('konum', { required: true })}>
    <option value="">Bölge seçin</option>
    <option value="Ölüdeniz">Ölüdeniz</option>
    <option value="Çalış">Çalış</option>
    <option value="Göcek">Göcek</option>
    <option value="Hisarönü">Hisarönü</option>
    <option value="Kayaköy">Kayaköy</option>
    <option value="Fethiye Merkez">Fethiye Merkez</option>
  </select>
</div>

// Sayısal bilgiler — + - butonlarla, anlamlı etiketlerle
<div className="grid grid-cols-3 gap-4">
  <SayiInput label="Kapasite" altBaslik="Kişi sayısı" min={1} max={30} value={kapasite} onChange={setKapasite} />
  <SayiInput label="Yatak Odası" altBaslik="Oda sayısı" min={1} max={20} value={yatakOdasi} onChange={setYatakOdasi} />
  <SayiInput label="Banyo" altBaslik="Banyo sayısı" min={1} max={10} value={banyo} onChange={setBanyo} />
</div>
```

**SayiInput bileşeni — artık "ne olduğu belli olmayan kutucuklar" yok:**
```tsx
function SayiInput({ label, altBaslik, min, max, value, onChange }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="font-semibold text-gray-900 text-sm">{label}</div>
      <div className="text-xs text-gray-400 mb-3">{altBaslik}</div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
            hover:border-sky-500 hover:text-sky-500 transition-colors disabled:opacity-40"
          disabled={value <= min}>
          <Minus size={14} />
        </button>
        <span className="font-bold text-xl text-gray-900">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
            hover:border-sky-500 hover:text-sky-500 transition-colors disabled:opacity-40"
          disabled={value >= max}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
```

**ADIM 2 — Fotoğraflar:**
```tsx
// Drag & drop upload
<div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors
  ${dragOver ? 'border-sky-500 bg-sky-50' : 'border-gray-300 hover:border-gray-400'}`}
  onDragOver={handleDragOver} onDrop={handleDrop}>
  <Upload size={40} className="text-gray-300 mx-auto mb-3" />
  <div className="font-medium text-gray-700">Fotoğrafları sürükleyip bırakın</div>
  <div className="text-sm text-gray-400 mt-1">veya</div>
  <label className="btn-primary inline-block mt-3 cursor-pointer">
    Bilgisayardan Seç
    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
  </label>
  <div className="text-xs text-gray-400 mt-3">Min 3, max 15 fotoğraf • JPG, PNG • Max 5MB</div>
</div>

{/* Yüklenen fotoğraflar grid */}
<div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
  {fotograflar.map((foto, i) => (
    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
      <Image src={foto.preview} alt="" fill className="object-cover" />
      {i === 0 && (
        <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
          Kapak
        </div>
      )}
      {foto.uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-xs">{foto.progress}%</div>
        </div>
      )}
      <button onClick={() => fotografSil(i)}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full
          opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <X size={12} />
      </button>
    </div>
  ))}
</div>
```

**ADIM 3 — Özellikler & Konum:**
```tsx
// Özellikler — ikonlu checkbox grid
const ozellikler = [
  { key: 'havuz', label: 'Özel Havuz', icon: '🏊' },
  { key: 'wifi', label: 'WiFi', icon: '📶' },
  { key: 'klima', label: 'Klima', icon: '❄️' },
  { key: 'deniz_manzarasi', label: 'Deniz Manzarası', icon: '🌊' },
  { key: 'bahce', label: 'Bahçe', icon: '🌿' },
  { key: 'bbq', label: 'BBQ / Mangal', icon: '🔥' },
  { key: 'otopark', label: 'Otopark', icon: '🚗' },
  { key: 'camasir_makinesi', label: 'Çamaşır Makinesi', icon: '🧺' },
  { key: 'bulasik_makinesi', label: 'Bulaşık Makinesi', icon: '🍽️' },
  { key: 'smart_tv', label: 'Smart TV', icon: '📺' },
  { key: 'jenerator', label: 'Jeneratör', icon: '⚡' },
  { key: 'tekne_iskelesi', label: 'Tekne İskelesi', icon: '⚓' },
  { key: 'jakuzi', label: 'Jakuzi', icon: '🛁' },
  { key: 'sauna', label: 'Sauna', icon: '🧖' },
  { key: 'cocuk_dostu', label: 'Çocuk Dostu', icon: '👶' },
  { key: 'evcil_hayvan', label: 'Evcil Hayvan İzinli', icon: '🐾' },
]

<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {ozellikler.map(({ key, label, icon }) => (
    <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer
      transition-all ${seciliOzellikler[key] ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}>
      <input type="checkbox" className="hidden"
        checked={seciliOzellikler[key] ?? false}
        onChange={e => setSeciliOzellikler(prev => ({ ...prev, [key]: e.target.checked }))} />
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {seciliOzellikler[key] && <Check size={14} className="text-sky-500 ml-auto" />}
    </label>
  ))}
</div>
```

**ADIM 4 — Fiyat & Kurallar:**
```tsx
// Fiyat giriş alanları — açıklayıcı
<div className="grid md:grid-cols-2 gap-4 mb-6">
  <div>
    <label className="form-label">Gecelik Fiyat (₺) *</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₺</span>
      <input type="number" placeholder="4500" className="form-input pl-8"
        {...register('gunluk_fiyat', { required: true, min: 100 })} />
    </div>
    <p className="text-xs text-gray-400 mt-1">Standart dönem için gecelik fiyat</p>
  </div>
  <div>
    <label className="form-label">Temizlik Ücreti (₺) *</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₺</span>
      <input type="number" placeholder="500" className="form-input pl-8"
        {...register('temizlik_ucreti', { required: true, min: 0 })} />
    </div>
    <p className="text-xs text-gray-400 mt-1">Rezervasyon başına tek seferlik</p>
  </div>
</div>

// Minimum kiralama süresi
<div className="mb-4">
  <label className="form-label">Minimum Kiralama Süresi</label>
  <div className="flex gap-2">
    {[1, 2, 3, 5, 7].map(gun => (
      <button key={gun} type="button"
        onClick={() => setMinSure(gun)}
        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all
          ${minSure === gun ? 'border-sky-500 bg-sky-50 text-sky-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
        {gun} Gece
      </button>
    ))}
  </div>
</div>

// Ev kuralları
<div className="mb-4">
  <label className="form-label">Ev Kuralları</label>
  <div className="grid grid-cols-2 gap-3">
    {[
      { key: 'sigara_izin', label: 'Sigara İzinli', icon: '🚬' },
      { key: 'evcil_hayvan_izin', label: 'Evcil Hayvan İzinli', icon: '🐾' },
      { key: 'parti_izin', label: 'Parti / Etkinlik İzinli', icon: '🎉' },
      { key: 'bebek_izin', label: 'Bebek Kabul', icon: '👶' },
    ].map(({ key, label, icon }) => (
      <label key={key} className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer hover:bg-gray-50">
        <input type="checkbox" {...register(key)} className="rounded" />
        <span>{icon}</span>
        <span className="text-sm">{label}</span>
      </label>
    ))}
  </div>
</div>
```

### 2.2 Kullanıcı paket ekleyebilir (Villa + Tekne birlikte)
`/panel/ilanlarim/yeni`'ye yeni bir tip ekle:

```tsx
// İlan türü seçimine "Paket" ekle:
<button onClick={() => setTip('paket')} className="...">
  <Package size={32} />
  <div className="font-semibold mt-2">Paket</div>
  <div className="text-xs text-gray-500 mt-1">Villa + Tekne kombinasyonu</div>
</button>

// tip === 'paket' seçilince Adım 1'de ek alan göster:
{tip === 'paket' && (
  <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
    <div className="font-semibold text-amber-800 mb-3">📦 Pakete Dahil Edilecek İlanlar</div>
    <p className="text-sm text-amber-700 mb-3">Mevcut ilanlarınızdan villa ve tekne seçin:</p>
    {mevcutIlanlar.map(ilan => (
      <label key={ilan.id} className="flex items-center gap-2 mb-2">
        <input type="checkbox" value={ilan.id}
          onChange={e => {
            if (e.target.checked) setPaketIlanIdleri(prev => [...prev, ilan.id])
            else setPaketIlanIdleri(prev => prev.filter(id => id !== ilan.id))
          }} />
        <span className="text-sm">{ilan.baslik} — {ilan.tip === 'villa' ? '🏠' : '⛵'}</span>
      </label>
    ))}
    
    <div className="mt-3">
      <label className="form-label">Paket Kategorisi</label>
      <select className="form-input" {...register('kategori')}>
        <option value="macera">Macera</option>
        <option value="luks">Lüks</option>
        <option value="romantik">Romantik</option>
        <option value="aile">Aile</option>
      </select>
    </div>
  </div>
)}
```

Paket submit edilince `paketler` tablosuna kaydet (ilanlar değil):
```ts
if (tip === 'paket') {
  await supabase.from('paketler').insert({
    baslik, aciklama, kategori,
    sure_gun: minSure,
    kapasite,
    fiyat: gunluk_fiyat,
    ilan_idleri: paketIlanIdleri,
    aktif: false // admin onayı bekle
  })
}
```

---

## BÖLÜM 3 — ADMIN PANELİ — TAKVİM YÖNETİMİ ÇALIŞMIYOR

### 3.1 /yonetim/ilanlar/[id]/takvim — tamamen yeniden yaz

**Sorun:** Admin takvimden günleri seçip dolu/müsait yapamıyor.

```tsx
// app/yonetim/ilanlar/[id]/takvim/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { createClient } from '@/lib/supabase/client'
import { tr } from 'date-fns/locale'
import { format, eachDayOfInterval } from 'date-fns'

export default function TakvimYonetimi({ params }: { params: { id: string } }) {
  const [seciliGunler, setSeciliGunler] = useState<Date[]>([])
  const [doluGunler, setDoluGunler] = useState<Date[]>([])
  const [islem, setIslem] = useState<'dolu' | 'musait' | 'ozel_fiyat'>('dolu')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [range, setRange] = useState<{from?: Date, to?: Date}>({})
  const supabase = createClient()

  // Mevcut müsaitlik verilerini çek
  useEffect(() => {
    fetchMusaitlik()
  }, [params.id])

  const fetchMusaitlik = async () => {
    const { data } = await supabase
      .from('musaitlik')
      .select('tarih, durum')
      .eq('ilan_id', params.id)
    
    if (data) {
      const dolu = data
        .filter(m => m.durum === 'dolu')
        .map(m => new Date(m.tarih))
      setDoluGunler(dolu)
    }
  }

  // Seçilen aralığı işle
  const handleKaydet = async () => {
    if (!range.from) return
    setYukleniyor(true)

    const gunler = range.to
      ? eachDayOfInterval({ start: range.from, end: range.to })
      : [range.from]

    if (islem === 'musait') {
      // Dolu günleri sil
      const tarihler = gunler.map(g => format(g, 'yyyy-MM-dd'))
      await supabase
        .from('musaitlik')
        .delete()
        .eq('ilan_id', params.id)
        .in('tarih', tarihler)
    } else {
      // Dolu veya özel fiyat olarak ekle
      const rows = gunler.map(g => ({
        ilan_id: params.id,
        tarih: format(g, 'yyyy-MM-dd'),
        durum: islem,
      }))
      
      await supabase
        .from('musaitlik')
        .upsert(rows, { onConflict: 'ilan_id,tarih' })
    }

    await fetchMusaitlik()
    setRange({})
    setYukleniyor(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Takvim Yönetimi</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Takvim */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <DayPicker
            mode="range"
            selected={range as any}
            onSelect={(r: any) => setRange(r ?? {})}
            locale={tr}
            numberOfMonths={1}
            modifiers={{ dolu: doluGunler }}
            modifiersStyles={{
              dolu: { backgroundColor: '#FEE2E2', color: '#991B1B' }
            }}
          />
        </div>

        {/* İşlem paneli */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">İşlem Seç</h3>
          
          <div className="space-y-3 mb-6">
            {[
              { val: 'dolu', label: 'Dolu İşaretle', color: 'red', desc: 'Bu günler rezervasyona kapalı olur' },
              { val: 'musait', label: 'Müsait Yap', color: 'green', desc: 'Dolu işaretini kaldır' },
              { val: 'ozel_fiyat', label: 'Özel Fiyat', color: 'amber', desc: 'Sezon fiyatı ekle' },
            ].map(({ val, label, color, desc }) => (
              <label key={val} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer
                transition-all ${islem === val ? `border-${color}-500 bg-${color}-50` : 'border-gray-200'}`}>
                <input type="radio" name="islem" value={val}
                  checked={islem === val} onChange={() => setIslem(val as any)}
                  className="mt-1" />
                <div>
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </label>
            ))}
          </div>

          {range.from && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <div className="font-medium">Seçilen Tarihler:</div>
              <div className="text-gray-600 mt-1">
                {format(range.from, 'd MMMM yyyy', { locale: tr })}
                {range.to && ` — ${format(range.to, 'd MMMM yyyy', { locale: tr })}`}
              </div>
            </div>
          )}

          <button onClick={handleKaydet} disabled={!range.from || yukleniyor}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>

          {/* Renk açıklaması */}
          <div className="mt-6 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Renk Açıklaması</div>
            {[
              { renk: 'bg-red-100', label: 'Dolu' },
              { renk: 'bg-green-100', label: 'Müsait' },
              { renk: 'bg-amber-100', label: 'Özel Fiyat' },
              { renk: 'bg-blue-100', label: 'Onaylı Rezervasyon' },
            ].map(({ renk, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded ${renk} border`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## BÖLÜM 4 — VİLLASEPETİ.COM'DAN İLHAM ALINAN ÖZELLİKLER

### 4.1 Detaylı villa özellikleri sayfası (villasepeti tarzı)
İlan detay sayfasına ekle:
```tsx
// Fiyata dahil olanlar / olmayanlar
<div className="grid md:grid-cols-2 gap-6 mt-6">
  <div>
    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
      <CheckCircle size={18} className="text-green-500" /> Fiyata Dahil
    </h4>
    <ul className="space-y-2">
      {['Temizlik hizmeti', 'Havlu ve çarşaf', 'WiFi', 'Otopark'].map(item => (
        <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
          <Check size={14} className="text-green-500" /> {item}
        </li>
      ))}
    </ul>
  </div>
  <div>
    <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
      <XCircle size={18} className="text-red-500" /> Fiyata Dahil Değil
    </h4>
    <ul className="space-y-2">
      {['Elektrik (sezon dışı)', 'Transfer', 'Ek temizlik'].map(item => (
        <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
          <X size={14} className="text-red-400" /> {item}
        </li>
      ))}
    </ul>
  </div>
</div>
```

### 4.2 Rezervasyon sözleşmesi ve seyahat belgesi (villasepeti'nde var)
Rezervasyon onay sayfasına ekle:
```tsx
<div className="bg-blue-50 rounded-xl p-4 mt-4">
  <h4 className="font-semibold text-blue-800 mb-2">📄 Belgeleriniz</h4>
  <p className="text-sm text-blue-700 mb-3">
    Rezervasyonunuz onaylandıktan sonra kiralama sözleşmeniz ve seyahat belgeniz 
    email adresinize gönderilecektir.
  </p>
  <div className="flex gap-2">
    <button className="text-xs text-blue-600 underline">Sözleşme Örneği</button>
    <button className="text-xs text-blue-600 underline">Ön Bilgilendirme Formu</button>
  </div>
</div>
```

### 4.3 Havuz boyutları ve detaylı özellikler
İlan detay sayfasına teknik özellikler tablosu ekle:
```tsx
<div className="border rounded-2xl overflow-hidden mt-6">
  <table className="w-full text-sm">
    <tbody>
      {[
        ['Havuz Boyutu', '8m × 4m özel havuz'],
        ['Havuz Isıtma', 'Isıtmalı (Ekim-Nisan)'],
        ['İnternet', 'Fiber WiFi — 50 Mbps'],
        ['Giriş', '14:00', ],
        ['Çıkış', '12:00'],
        ['Minimum Kiralama', '3 Gece'],
      ].map(([key, val]) => (
        <tr key={key} className="border-t border-gray-100">
          <td className="px-4 py-3 text-gray-500 bg-gray-50 font-medium w-1/3">{key}</td>
          <td className="px-4 py-3 text-gray-900">{val}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 4.4 Erken rezervasyon fırsatları (villasepeti'nde banner var)
```tsx
// Ana sayfa hero altına veya üstüne:
<div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white py-3 px-4">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-xl">🏖️</span>
      <span className="font-semibold">2026 Yaz Sezonu Erken Rezervasyon Başladı!</span>
      <span className="text-white/80 text-sm hidden md:block">— Haziran öncesi rezervasyonlarda %15'e kadar indirim</span>
    </div>
    <Link href="/konaklama" className="bg-white text-amber-600 font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-amber-50 transition-colors">
      İncele →
    </Link>
  </div>
</div>
```

---

## BÖLÜM 5 — TAM MOBİL UYUMLULUK

### 5.1 Viewport ve temel mobile CSS
```css
/* globals.css */
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { overflow-x: hidden; min-height: 100dvh; }

/* Touch hedefleri min 48px */
button, a, input, select, textarea, label[for] {
  min-height: 44px;
  touch-action: manipulation;
}

/* Mobil input zoom önleme */
@media (max-width: 768px) {
  input, select, textarea { font-size: 16px !important; }
}
```

### 5.2 Header — mobil hamburger menü
```tsx
// components/Header.tsx — mobil kısım
'use client'
const [menuAcik, setMenuAcik] = useState(false)

{/* Hamburger */}
<button className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
  onClick={() => setMenuAcik(true)}>
  <Menu size={24} />
</button>

{/* Mobile drawer */}
{menuAcik && (
  <>
    {/* Overlay */}
    <div className="fixed inset-0 bg-black/50 z-40 md:hidden"
      onClick={() => setMenuAcik(false)} />
    
    {/* Drawer — sağdan kayar */}
    <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white z-50
      shadow-2xl md:hidden flex flex-col">
      <div className="flex items-center justify-between p-5 border-b">
        <span className="font-bold text-sky-600 text-lg">SezondalKirala</span>
        <button onClick={() => setMenuAcik(false)} className="p-2 rounded-xl hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        {[
          { href: '/', label: 'Ana Sayfa', icon: Home },
          { href: '/konaklama', label: 'Konaklama', icon: Building },
          { href: '/tekneler', label: 'Tekneler', icon: Sailboat },
          { href: '/paketler', label: 'Paketler', icon: Package },
          { href: '/hakkimizda', label: 'Hakkımızda', icon: Info },
          { href: '/sss', label: 'SSS', icon: HelpCircle },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
            onClick={() => setMenuAcik(false)}>
            <Icon size={20} className="text-gray-400" />
            <span className="font-medium text-gray-700">{label}</span>
            <ChevronRight size={16} className="text-gray-300 ml-auto" />
          </Link>
        ))}
      </nav>
      
      <div className="p-5 border-t space-y-3">
        {user ? (
          <div className="text-sm text-gray-600">Hoş geldin, {adSoyad}</div>
        ) : (
          <>
            <Link href="/giris" className="btn-outline w-full text-center block"
              onClick={() => setMenuAcik(false)}>Giriş Yap</Link>
            <Link href="/kayit" className="btn-primary w-full text-center block"
              onClick={() => setMenuAcik(false)}>Kayıt Ol</Link>
          </>
        )}
      </div>
    </div>
  </>
)}
```

### 5.3 İlan kartları — mobil grid
```tsx
// /konaklama sayfası
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {ilanlar.map(ilan => <VillaKart key={ilan.id} ilan={ilan} />)}
</div>
```

### 5.4 İlan detay — mobil layout
```tsx
// Masaüstü: 2 kolon, mobil: tek kolon, fiyat kartı alta gelir
<div className="grid lg:grid-cols-3 gap-8">
  <div className="lg:col-span-2">
    {/* İlan içeriği */}
  </div>
  <div className="lg:col-span-1">
    {/* Fiyat kartı — masaüstünde sticky, mobilde normal */}
    <div className="lg:sticky lg:top-24 hidden lg:block">
      <FiyatKarti ilan={ilan} />
    </div>
  </div>
</div>

{/* Mobil sticky bottom bar */}
<div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t
  border-gray-200 p-4 flex items-center gap-3 lg:hidden z-50
  safe-area-inset-bottom">
  <div className="flex-1 min-w-0">
    <div className="font-bold text-gray-900 text-lg leading-none">
      ₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}
    </div>
    <div className="text-xs text-gray-500">/ gece</div>
  </div>
  <Link href={rezervasyonUrl}
    className="btn-primary flex-1 text-center py-3 text-sm font-semibold">
    Rezervasyon Yap
  </Link>
  <a href={`https://wa.me/${WHATSAPP_NUMBER}`}
    className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
    <MessageCircle size={20} className="text-white" />
  </a>
</div>

{/* Mobil için alt boşluk bırak */}
<div className="h-24 lg:hidden" />
```

### 5.5 Arama formu — mobil
```tsx
// SearchForm.tsx — mobil dikey layout
<div className="bg-white rounded-2xl shadow-2xl p-3" style={{ zIndex: 100 }}>
  <div className="flex flex-col md:flex-row gap-2 md:gap-0">
    <div className="flex-1 px-3 py-2 md:px-4 md:py-3 cursor-pointer hover:bg-gray-50 
      rounded-xl transition-colors md:rounded-none md:border-r border-gray-200"
      onClick={() => setAcikPanel('tarih')}>
      <div className="text-xs font-semibold text-gray-400 uppercase">GİRİŞ — ÇIKIŞ</div>
      <div className="text-gray-900 font-medium text-sm md:text-base mt-0.5">
        {girisTarihi && cikisTarihi
          ? `${format(girisTarihi,'d MMM',{locale:tr})} — ${format(cikisTarihi,'d MMM',{locale:tr})}`
          : 'Tarih seçin'}
      </div>
    </div>
    <div className="flex gap-2">
      <div className="flex-1 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-xl
        md:rounded-none md:border-r border-gray-200 md:px-4 md:py-3"
        onClick={() => setAcikPanel('misafir')}>
        <div className="text-xs font-semibold text-gray-400 uppercase">MİSAFİR</div>
        <div className="text-gray-900 font-medium text-sm mt-0.5">
          {toplamMisafir > 0 ? `${yetiskin}Y ${cocuk > 0 ? `${cocuk}Ç` : ''}` : 'Kişi'}
        </div>
      </div>
      <button onClick={ara}
        className="btn-primary px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap">
        <Search size={16} className="inline md:hidden" />
        <span className="hidden md:inline">Villa Ara</span>
      </button>
    </div>
  </div>
</div>
```

### 5.6 WhatsApp floating button — mobil
```tsx
<a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Merhaba, bilgi almak istiyorum.`}
  className="fixed bottom-6 right-4 z-40 w-14 h-14 bg-green-500 rounded-full
  flex items-center justify-center shadow-xl hover:bg-green-600 transition-all
  hover:scale-110 lg:bottom-8"
  style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}>
  <MessageCircle size={26} className="text-white" />
</a>
```

### 5.7 Rezervasyon wizard — mobil
```tsx
// Adım göstergesi mobilde sadece sayılar
<div className="flex items-center justify-center gap-2 mb-6">
  {[1,2,3,4].map(i => (
    <React.Fragment key={i}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
        ${aktifAdim > i ? 'bg-green-500 text-white' :
          aktifAdim === i ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {aktifAdim > i ? <Check size={14} /> : i}
      </div>
      {i < 4 && <div className={`h-0.5 w-8 ${aktifAdim > i ? 'bg-green-500' : 'bg-gray-200'}`} />}
    </React.Fragment>
  ))}
</div>

// Adım başlığı (mobilde tıklanamaz)
<div className="text-center mb-6">
  <div className="text-xs text-gray-400 uppercase">Adım {aktifAdim} / 4</div>
  <div className="font-bold text-lg mt-1">{adimBasliklari[aktifAdim - 1]}</div>
</div>
```

---

## BÖLÜM 6 — GENEL SAYFALAR İYİLEŞTİRME

### 6.1 /konaklama — filtre sidebar mobilde drawer
```tsx
{/* Mobilde "Filtrele" butonu */}
<button className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 text-sm md:hidden"
  onClick={() => setFiltrePaneliAcik(true)}>
  <SlidersHorizontal size={16} /> Filtrele
  {aktifFiltreSayisi > 0 && (
    <span className="bg-sky-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {aktifFiltreSayisi}
    </span>
  )}
</button>

{/* Mobil bottom sheet */}
{filtrePaneliAcik && (
  <>
    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setFiltrePaneliAcik(false)} />
    <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto">
      <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b">
        <h3 className="font-bold">Filtreler</h3>
        <button onClick={() => setFiltrePaneliAcik(false)}>
          <X size={20} />
        </button>
      </div>
      <div className="p-4">
        {/* Filtre içeriği */}
      </div>
      <div className="sticky bottom-0 bg-white p-4 border-t flex gap-3">
        <button onClick={filtreleriTemizle} className="flex-1 btn-outline">Temizle</button>
        <button onClick={() => { filtrele(); setFiltrePaneliAcik(false) }} className="flex-1 btn-primary">
          Uygula
        </button>
      </div>
    </div>
  </>
)}
```

### 6.2 Paketler sayfası — görsel iyileştirme
```tsx
// Paket kartları daha zengin:
<div className="villa-card group">
  <div className="relative h-52 overflow-hidden">
    <Image src={paketGorseli} alt={paket.baslik} fill className="object-cover
      group-hover:scale-105 transition-transform duration-500" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
    <span className={`absolute top-3 left-3 badge ${kategoriRenkler[paket.kategori]}`}>
      {kategoriEmojilar[paket.kategori]} {paket.kategori}
    </span>
    <div className="absolute bottom-3 left-3 right-3">
      <h3 className="font-bold text-white text-lg leading-tight">{paket.baslik}</h3>
    </div>
  </div>
  <div className="p-5">
    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{paket.aciklama}</p>
    <div className="flex gap-4 text-sm text-gray-500 mb-4">
      <span className="flex items-center gap-1.5"><Clock size={13}/> {paket.sure_gun} gün</span>
      <span className="flex items-center gap-1.5"><Users size={13}/> Max {paket.kapasite} kişi</span>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <span className="text-xl font-bold text-sky-600">
          ₺{paket.fiyat.toLocaleString('tr-TR')}
        </span>
        <span className="text-gray-400 text-xs"> toplam</span>
      </div>
      <Link href={`/paketler/${paket.id}`} className="btn-primary text-sm py-2 px-4">
        İncele →
      </Link>
    </div>
  </div>
</div>
```

---

## SONUNDA

```bash
npm run build && npm run lint
```

**Test listesi:**
1. Giriş yap → header anında kullanıcı adını gösteriyor mu? (F5 olmadan)
2. Çıkış yap → header anında "Giriş Yap" gösteriyor mu?
3. Admin paneline gir → başka sayfaya git → ana sayfaya dön → doğru kullanıcı görünüyor mu?
4. `/panel/ilanlarim/yeni` → SayiInput bileşenlerinde +/- butonları çalışıyor mu?
5. Paket tipi seçilince villa+tekne kombinasyonu oluşturuluyor mu?
6. `/yonetim/ilanlar/[id]/takvim` → tarih seç → "Dolu İşaretle" → kaydediyor mu?
7. Mobilde hamburger menü açılıyor ve kapanıyor mu?
8. İlan detay sayfasında mobilde sticky bottom bar görünüyor mu?
9. Hero video tam ekranı kaplıyor mu, taşma var mı?
10. Takvim popup hero'nun üzerinde görünüyor mu, arkada kalmıyor mu?
