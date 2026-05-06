# SezondalKirala — Konaklama Sayfası & Genel Tatil Teması Promptu

Siteyi inceledim. Konaklama sayfası ve tüm site bembeyaz, tatil hissi yok.
Aşağıdakileri sırayla uygula.

---

## BÖLÜM 1 — GLOBAL RENK & ARKA PLAN SİSTEMİ

### 1.1 globals.css — Tüm site arka planı

```css
/* globals.css */

/* Ana arka plan — saf beyaz değil, deniz köpüğü tonu */
html, body {
  background-color: #f0f9ff; /* sky-50 — çok hafif mavi */
}

/* Sayfa geçiş renkleri */
:root {
  --bg-primary: #f0f9ff;      /* Ana arka plan — sky-50 */
  --bg-card: #ffffff;          /* Kartlar — beyaz */
  --bg-ocean: #e0f2fe;         /* Deniz mavisi bölümler — sky-100 */
  --bg-nature: #f0fdf4;        /* Yeşil doğa bölümler — green-50 */
  --bg-coral: #fff7ed;         /* Sıcak bölümler — orange-50 */
  --bg-dark: #0f172a;          /* Koyu bölümler */
  
  --accent-ocean: #0ea5e9;     /* Okyanus mavisi */
  --accent-teal: #06b6d4;      /* Turkuaz */
  --accent-nature: #22c55e;    /* Doğa yeşili */
  --accent-sand: #f59e0b;      /* Kum sarısı */
  --accent-coral: #f97316;     /* Mercan */
}

/* Konaklama sayfası arka planı */
.page-konaklama {
  background: linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 200px, #f0f9ff 100%);
}

/* Section arka planları */
.section-ocean {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
}
.section-nature {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}
.section-warm {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
}
.section-teal {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
}

/* Kart — deniz cam efekti */
.card-glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(14, 165, 233, 0.1);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(14, 165, 233, 0.08);
}

/* Villa kartı hover — deniz rengi glow */
.villa-card:hover {
  box-shadow: 0 20px 60px rgba(14, 165, 233, 0.2);
  transform: translateY(-8px);
  border-color: rgba(14, 165, 233, 0.3);
}

/* Filtre sidebar — deniz temalı */
.filter-sidebar {
  background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
  border: 1px solid #bae6fd;
  border-radius: 20px;
}
```

### 1.2 tailwind.config.ts — Deniz teması renkleri

```ts
extend: {
  colors: {
    ocean: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      900: '#0c4a6e',
    },
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      400: '#2dd4bf',
      500: '#14b8a6',
    },
    nature: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
    },
    sand: {
      50: '#fffbeb',
      100: '#fef3c7',
      400: '#fbbf24',
      500: '#f59e0b',
    },
  },
}
```

---

## BÖLÜM 2 — KONAKLAMA SAYFASI — KOMPLE YENİDEN TASARIM

### 2.1 Sayfa başlığı — hero bölümü

```tsx
// app/konaklama/page.tsx — en üste ekle
<div style={{
  background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0284c7 100%)',
  padding: '48px 0 80px',
  position: 'relative',
  overflow: 'hidden',
}}>
  {/* Dekoratif daireler */}
  <div style={{
    position: 'absolute', top: '-40px', right: '-40px',
    width: '200px', height: '200px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
  }} />
  <div style={{
    position: 'absolute', bottom: '-60px', left: '10%',
    width: '150px', height: '150px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
  }} />

  <div className="max-w-7xl mx-auto px-4 relative z-10">
    {/* Breadcrumb */}
    <div className="flex items-center gap-2 text-sky-200 text-sm mb-4">
      <a href="/" className="hover:text-white transition-colors">Ana Sayfa</a>
      <span>/</span>
      <span className="text-white font-medium">Konaklama</span>
    </div>

    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
      Fethiye Villa Kiralama
    </h1>
    <p className="text-sky-100 text-lg mb-6">
      {ilanSayisi}+ onaylı villa ile hayalinizdeki tatili bulun
    </p>

    {/* Mini arama formu */}
    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20
      flex flex-wrap gap-3 items-center max-w-3xl">
      <div className="flex-1 min-w-32">
        <div className="text-xs text-sky-200 mb-1">Giriş</div>
        <input type="date" className="bg-transparent text-white text-sm w-full outline-none" />
      </div>
      <div className="w-px h-8 bg-white/20" />
      <div className="flex-1 min-w-32">
        <div className="text-xs text-sky-200 mb-1">Çıkış</div>
        <input type="date" className="bg-transparent text-white text-sm w-full outline-none" />
      </div>
      <div className="w-px h-8 bg-white/20" />
      <div className="flex-1 min-w-20">
        <div className="text-xs text-sky-200 mb-1">Misafir</div>
        <div className="text-white text-sm">2 kişi</div>
      </div>
      <button className="bg-white text-sky-600 font-bold px-5 py-2.5 rounded-xl
        hover:bg-sky-50 transition-colors text-sm whitespace-nowrap">
        🔍 Ara
      </button>
    </div>
  </div>
</div>

{/* Dalga geçişi */}
<div style={{ marginTop: '-2px', lineHeight: 0, background: '#f0f9ff' }}>
  <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
      fill="#0ea5e9" opacity="0.1" />
    <path d="M0,40 C480,10 960,60 1440,20 L1440,60 L0,60 Z"
      fill="#f0f9ff" />
  </svg>
</div>
```

### 2.2 Sayfa ana içerik arka planı

```tsx
// Ana içerik wrapper
<div style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 500px)' }}>
  <div className="max-w-7xl mx-auto px-4 py-8">
    <div className="flex gap-8">
      <FilterSidebar /> {/* Sol */}
      <div className="flex-1"> {/* Sağ */}
        {/* içerik */}
      </div>
    </div>
  </div>
</div>
```

### 2.3 Filtre sidebar — deniz temalı

```tsx
// components/VillaFiltreSidebar.tsx
<aside className="w-72 flex-shrink-0 hidden md:block">
  <div style={{
    background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)',
    border: '1px solid #bae6fd',
    borderRadius: '20px',
    overflow: 'hidden',
    position: 'sticky',
    top: '96px',
    boxShadow: '0 4px 24px rgba(14,165,233,0.08)',
  }}>
    {/* Sidebar başlığı */}
    <div style={{
      background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
      padding: '16px 20px',
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold">
          <SlidersHorizontal size={16} />
          Filtreler
        </div>
        {aktifFiltreSayisi > 0 && (
          <button onClick={temizle}
            className="text-sky-200 hover:text-white text-xs transition-colors">
            Temizle ({aktifFiltreSayisi})
          </button>
        )}
      </div>
    </div>

    <div className="p-5 space-y-5">
      {/* Konum filtresi */}
      <div>
        <label className="text-xs font-bold text-sky-700 uppercase tracking-wider
          flex items-center gap-1.5 mb-3">
          <MapPin size={12} /> Bölge
        </label>
        <div className="space-y-1.5">
          {['Ölüdeniz', 'Çalış', 'Göcek', 'Hisarönü', 'Kayaköy', 'Fethiye Merkez'].map(bolge => {
            const aktif = searchParams.get('konum') === bolge
            return (
              <label key={bolge}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer
                  transition-all text-sm ${aktif
                    ? 'bg-sky-100 text-sky-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={aktif}
                  onChange={() => setParam('konum', aktif ? null : bolge)}
                  className="rounded accent-sky-500 w-3.5 h-3.5" />
                {bolge}
                {aktif && <Check size={12} className="ml-auto text-sky-500" />}
              </label>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />

      {/* Fiyat aralığı */}
      <div>
        <label className="text-xs font-bold text-sky-700 uppercase tracking-wider
          flex items-center gap-1.5 mb-3">
          <DollarSign size={12} /> Gecelik Fiyat (₺)
        </label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min"
            defaultValue={searchParams.get('fiyat_min') ?? ''}
            onBlur={e => setParam('fiyat_min', e.target.value || null)}
            className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm
              focus:outline-none focus:border-sky-400 bg-sky-50/50" />
          <input type="number" placeholder="Max"
            defaultValue={searchParams.get('fiyat_max') ?? ''}
            onBlur={e => setParam('fiyat_max', e.target.value || null)}
            className="w-full border border-sky-200 rounded-xl px-3 py-2 text-sm
              focus:outline-none focus:border-sky-400 bg-sky-50/50" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />

      {/* Kapasite */}
      <div>
        <label className="text-xs font-bold text-sky-700 uppercase tracking-wider
          flex items-center gap-1.5 mb-3">
          <Users size={12} /> Kapasite
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '2 kişi', val: '2' },
            { label: '4 kişi', val: '4' },
            { label: '6 kişi', val: '6' },
            { label: '8+ kişi', val: '8' },
          ].map(({ label, val }) => {
            const aktif = searchParams.get('kapasite') === val
            return (
              <button key={val}
                onClick={() => setParam('kapasite', aktif ? null : val)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all
                  ${aktif
                    ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                    : 'border-sky-200 text-gray-600 hover:border-sky-400 bg-white'}`}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />

      {/* Özellikler */}
      <div>
        <label className="text-xs font-bold text-sky-700 uppercase tracking-wider
          flex items-center gap-1.5 mb-3">
          <Sparkles size={12} /> Özellikler
        </label>
        <div className="space-y-1.5">
          {[
            { key: 'havuz', label: 'Özel Havuz', emoji: '🏊' },
            { key: 'wifi', label: 'WiFi', emoji: '📶' },
            { key: 'klima', label: 'Klima', emoji: '❄️' },
            { key: 'deniz_manzarasi', label: 'Deniz Manzarası', emoji: '🌊' },
            { key: 'bahce', label: 'Bahçe', emoji: '🌿' },
            { key: 'bbq', label: 'BBQ / Mangal', emoji: '🔥' },
            { key: 'jakuzi', label: 'Jakuzi', emoji: '🛁' },
            { key: 'evcil_hayvan', label: 'Evcil Hayvan', emoji: '🐾' },
          ].map(({ key, label, emoji }) => {
            const aktif = searchParams.get(key) === 'true'
            return (
              <label key={key}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer
                  transition-all text-sm ${aktif
                    ? 'bg-sky-100 text-sky-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={aktif}
                  onChange={() => setParam(key, aktif ? null : 'true')}
                  className="rounded accent-sky-500 w-3.5 h-3.5" />
                <span>{emoji}</span> {label}
              </label>
            )
          })}
        </div>
      </div>

      {/* Filtrele butonu */}
      <button className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
        style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
        🔍 Filtrele
      </button>
    </div>
  </div>
</aside>
```

### 2.4 Villa kartı — büyük ve premium

```tsx
// components/VillaKart.tsx — tamamen yeniden yaz
<Link href={ilanUrl} className="group block">
  <div className="bg-white rounded-2xl overflow-hidden transition-all duration-400
    hover:-translate-y-2"
    style={{
      boxShadow: '0 4px 20px rgba(14,165,233,0.08)',
      border: '1px solid rgba(14,165,233,0.1)',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 20px 60px rgba(14,165,233,0.2)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,165,233,0.08)'}>

    {/* Görsel — büyük */}
    <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
      <Image
        src={kapakGorsel}
        alt={ilan.baslik}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-700"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
      />

      {/* Gradient overlay — alt */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Üst rozetler */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
        {ilan.sponsorlu && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
            ⭐ Öne Çıkan
          </span>
        )}
      </div>

      {/* Favori */}
      <button
        onClick={e => { e.preventDefault(); favoriEkle() }}
        className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm
          rounded-full flex items-center justify-center shadow-md
          hover:bg-white hover:scale-110 transition-all">
        <Heart size={16} className={favori ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
      </button>

      {/* Hover'da hızlı bilgi */}
      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100
        transition-opacity duration-300">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2
          flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Detayları Gör</span>
          <ChevronRight size={14} className="text-sky-500" />
        </div>
      </div>
    </div>

    {/* İçerik */}
    <div className="p-5">
      {/* Konum */}
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin size={12} className="text-sky-400 flex-shrink-0" />
        <span className="text-xs text-gray-400 font-medium">{ilan.konum}, Fethiye</span>
      </div>

      {/* Başlık */}
      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 mb-3
        group-hover:text-sky-600 transition-colors">
        {ilan.baslik}
      </h3>

      {/* Özellikler */}
      <div className="flex items-center gap-3 text-sm text-gray-500 pb-3
        border-b border-gray-100 mb-3">
        <span className="flex items-center gap-1.5">
          <Bed size={14} className="text-gray-400" />
          <span>{ilan.yatak_odasi} oda</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Bath size={14} className="text-gray-400" />
          <span>{ilan.banyo} banyo</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-gray-400" />
          <span>{ilan.kapasite} kişi</span>
        </span>
      </div>

      {/* Puan + Fiyat */}
      <div className="flex items-end justify-between">
        <div>
          {puan && (
            <div className="flex items-center gap-1 mb-1">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-gray-900">{puan}</span>
              <span className="text-xs text-gray-400">({yorumSayisi})</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {/* İlan özellik ikonları */}
            {ilan.ozellikler?.havuz && (
              <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">🏊</span>
            )}
            {ilan.ozellikler?.wifi && (
              <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">📶</span>
            )}
            {ilan.ozellikler?.deniz_manzarasi && (
              <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">🌊</span>
            )}
          </div>
        </div>

        <div className="text-right">
          {geceSayisi ? (
            <>
              <div className="font-black text-lg text-gray-900">
                ₺{((ilan.gunluk_fiyat * geceSayisi) + ilan.temizlik_ucreti).toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-gray-400">{geceSayisi} gece toplam</div>
            </>
          ) : (
            <>
              <div className="font-black text-lg text-gray-900">
                ₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-gray-400">/ gece</div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
</Link>
```

### 2.5 Sonuç bandı — filtre özeti

```tsx
{/* Listenin üstü */}
<div className="flex items-center justify-between mb-6">
  <div>
    <h2 className="font-bold text-gray-900 text-lg">
      {ilanlar.length} Villa Bulundu
    </h2>
    {aktifFiltreSayisi > 0 && (
      <div className="flex flex-wrap gap-2 mt-2">
        {/* Aktif filtre pilleri */}
        {searchParams.get('konum') && (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700
            rounded-full px-3 py-1 text-xs font-medium">
            📍 {searchParams.get('konum')}
            <button onClick={() => setParam('konum', null)}>
              <X size={10} />
            </button>
          </span>
        )}
        {/* Diğer aktif filtreler */}
      </div>
    )}
  </div>

  {/* Sıralama */}
  <select
    value={searchParams.get('siralama') ?? 'onerilen'}
    onChange={e => setParam('siralama', e.target.value)}
    className="border border-sky-200 rounded-xl px-3 py-2 text-sm bg-white
      focus:outline-none focus:border-sky-400 text-gray-700">
    <option value="onerilen">Önerilen</option>
    <option value="fiyat_artan">Fiyat ↑</option>
    <option value="fiyat_azalan">Fiyat ↓</option>
    <option value="en_yeni">En Yeni</option>
  </select>
</div>
```

### 2.6 İlan grid — daha büyük kartlar

```tsx
{/* 2 kolon masaüstü, 1 mobil — büyük kartlar */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {ilanlar.map(ilan => (
    <VillaKart key={ilan.id} ilan={ilan} geceSayisi={geceSayisi} />
  ))}
</div>
```

---

## BÖLÜM 3 — TÜM SAYFALARDA ARKA PLAN GEÇİŞLERİ

### 3.1 app/layout.tsx body arka planı

```tsx
<body style={{ background: '#f0f9ff' }}>
```

### 3.2 Her sayfanın arka planı

```tsx
// /konaklama
<div style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 300px)' }}>

// /tekneler  
<div style={{ background: 'linear-gradient(180deg, #ccfbf1 0%, #f0fdf4 300px)' }}>

// /paketler
<div style={{ background: 'linear-gradient(180deg, #fef3c7 0%, #fffbeb 300px)' }}>

// /hakkimizda
<div style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 300px)' }}>

// /sss
<div style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #f0f9ff 300px)' }}>

// /giris /kayit
<div style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)' }}>
```

### 3.3 Ana sayfa section renkleri

```
Section 1 — Hero: video/koyu
Section 2 — İstatistik bandı: beyaz
Section 3 — Neden Biz: linear-gradient(135deg, #0ea5e9, #06b6d4, #0284c7)
Section 4 — Paketler: linear-gradient(135deg, #f0fdf4, #dcfce7)
Section 5 — Kategoriler: #f0f9ff
Section 6 — Villalar: beyaz
Section 7 — Nasıl Çalışır: linear-gradient(135deg, #e0f2fe, #bae6fd)
Section 8 — Yorumlar: #fafafa
Section 9 — Bölgeler: #0f172a (koyu)
Section 10 — CTA: linear-gradient(135deg, #0ea5e9, #06b6d4, #22c55e)
Section 11 — Footer: #0f172a
```

---

## BÖLÜM 4 — BUTON & BADGE GÜNCELLEMESİ

### 4.1 globals.css buton sistemi

```css
.btn-primary {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  border-radius: 14px;
  padding: 12px 24px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.45);
  background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
}

.btn-ocean {
  background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
  color: white;
  border-radius: 14px;
  padding: 12px 24px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
}

/* Kategori badge'leri */
.badge-macera { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border-radius: 99px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
.badge-luks { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border-radius: 99px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
.badge-romantik { background: linear-gradient(135deg, #ec4899, #db2777); color: white; border-radius: 99px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
.badge-aile { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border-radius: 99px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
.badge-one-cikan { background: linear-gradient(135deg, #f59e0b, #f97316); color: white; border-radius: 99px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test:
1. /konaklama sayfasında üst hero bölümü mavi gradient mi?
2. Filtre sidebar'ı mavi temalı mı? (sky-50 arka plan, sky-200 border)
3. Villa kartları aspect-ratio 16/10 — daha büyük mü?
4. Hover'da kart yukarı kalkıyor, mavi glow görünüyor mu?
5. body arka planı #f0f9ff (hafif mavi) mi?
6. Her sayfanın üst kısmı farklı gradient renkte mi?
7. Butonlar gradient mavi mi?
