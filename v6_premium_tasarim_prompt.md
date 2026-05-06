# SezondalKirala — V6 Profesyonel Tasarım & Özellik Geliştirme Promptu

Rakip siteler (hepsivilla.com, garantivillam.com, tatildekirala.com, airbnb.com, villakiralama.com) incelendi. Aşağıdaki tüm değişiklikleri sırayla uygula. Her bölüm sonrası `npm run build` al.

---

## BÖLÜM 1 — KRİTİK BUG'LAR (İLK ÖNCE)

### 1.1 Video arka plan — tam ekranı kaplasın
Şu an video hero alanına sığmıyor, kenarlardan taşıyor veya boşluk kalıyor.

```tsx
// Hero section — video tam ekranı kaplamalı:
<section className="relative w-full h-screen min-h-[600px] overflow-hidden">
  <video
    autoPlay
    loop
    muted
    playsInline
    className="absolute inset-0 w-full h-full object-cover"
    style={{ zIndex: 0 }}
  >
    <source src="/videos/video.mp4" type="video/mp4" />
  </video>
  {/* Gradient overlay */}
  <div
    className="absolute inset-0"
    style={{
      background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)',
      zIndex: 1
    }}
  />
  {/* İçerik */}
  <div className="relative h-full flex flex-col items-center justify-center px-4" style={{ zIndex: 2 }}>
    {/* başlık, form vb. */}
  </div>
</section>
```

Önemli: `overflow-hidden` section'da olmalı, video `position: absolute` ve `object-cover` ile tam kaplamalı.

### 1.2 Takvim z-index sorunu — tarih seçici arkada kalıyor
Takvim popup'ı açıldığında hero section veya diğer elementlerin arkasında kalıyor.

```tsx
// Arama formu container'ına z-index ekle:
<div className="relative bg-white rounded-2xl shadow-2xl p-4" style={{ zIndex: 100 }}>
  {/* form içeriği */}
</div>

// Takvim popup'ı için:
<div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border"
  style={{ zIndex: 9999 }}>
  <DayPicker ... />
</div>

// globals.css'e ekle:
.rdp { position: relative; z-index: 9999; }
[data-radix-popper-content-wrapper] { z-index: 9999 !important; }
```

Ayrıca hero section'daki `overflow-hidden` takvim popup'ını kesiyorsa:
```tsx
// Hero section overflow'u değiştir:
// overflow-hidden → overflow-visible (video için wrapper kullan)
<section className="relative w-full h-screen">
  <div className="absolute inset-0 overflow-hidden"> {/* sadece video wrapper'ı overflow-hidden */}
    <video ... />
    <div className="overlay" />
  </div>
  <div className="relative z-10 h-full flex items-center justify-center">
    {/* içerik — takvim dahil */}
  </div>
</section>
```

---

## BÖLÜM 2 — GÖRSEL KİMLİK — SIFIRDAN YENİ TASARIM DİLİ

Rakip sitelerden farklılaşmak için benzersiz bir tasarım dili:

### 2.1 Renk sistemi — yeni
```css
/* tailwind.config.ts extend.colors */
'sea': {
  50: '#EFF9FF',
  100: '#DBEAFE', 
  400: '#38BDF8',
  500: '#0EA5E9',
  600: '#0284C7',
  900: '#0C4A6E',
},
'nature': {
  50: '#F0FDF4',
  100: '#DCFCE7',
  400: '#4ADE80',
  500: '#22C55E',
  600: '#16A34A',
  900: '#14532D',
},
'sand': {
  50: '#FFFBEB',
  100: '#FEF3C7',
  400: '#FBBF24',
  500: '#F59E0B',
},
'dusk': {
  800: '#1E293B',
  900: '#0F172A',
  950: '#020617',
},
```

### 2.2 Tipografi — premium his
```tsx
// app/layout.tsx
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// <html className={`${playfair.variable} ${inter.variable}`}>
```

```css
/* globals.css */
h1, h2, h3 { font-family: var(--font-playfair), Georgia, serif; }
body, p, span, button, input { font-family: var(--font-inter), system-ui, sans-serif; }

/* Başlık stilleri */
.heading-hero { font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
.heading-section { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 700; }
```

### 2.3 Kart tasarımı — premium
```css
/* globals.css */
.villa-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0,0,0,0.04);
}
.villa-card:hover {
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  transform: translateY(-8px);
}
.villa-card .card-image { overflow: hidden; }
.villa-card .card-image img { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.villa-card:hover .card-image img { transform: scale(1.08); }
```

### 2.4 Buton sistemi
```css
.btn-primary {
  background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
  color: white;
  border-radius: 14px;
  padding: 14px 28px;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.35);
  transition: all 0.2s;
  border: none;
}
.btn-primary:hover {
  background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5);
  transform: translateY(-1px);
}

.btn-whatsapp {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: white;
  border-radius: 14px;
  padding: 14px 28px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.35);
}
```

---

## BÖLÜM 3 — ANA SAYFA — KOMPLE YENİ TASARIM

### 3.1 Hero Section
```tsx
<section className="relative w-full h-screen min-h-[700px]">
  {/* Video wrapper — overflow-hidden burada */}
  <div className="absolute inset-0 overflow-hidden">
    <video autoPlay loop muted playsInline
      className="w-full h-full object-cover scale-105"> {/* hafif zoom ile daha sinematik */}
      <source src="/videos/video.mp4" type="video/mp4" />
    </video>
    {/* Çok katmanlı gradient — daha sinematik */}
    <div className="absolute inset-0" style={{
      background: `
        linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.3) 100%),
        linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)
      `
    }} />
  </div>

  {/* İçerik — sol hizalı (Airbnb/booking tarzı) */}
  <div className="relative z-10 h-full flex items-center">
    <div className="max-w-7xl mx-auto px-6 w-full">
      <div className="max-w-2xl">
        {/* Üst rozet */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md
          border border-white/20 rounded-full px-4 py-2 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">Fethiye'nin #1 Villa Platformu</span>
        </div>

        {/* Başlık — Playfair Display */}
        <h1 className="heading-hero text-white mb-4">
          Hayalinizdeki Tatil<br />
          <span className="text-sky-300">Fethiye'de Başlar</span>
        </h1>

        <p className="text-white/80 text-xl mb-10 leading-relaxed">
          Lüks villalar, özel tekneler ve TURSAB güvencesiyle<br />
          unutulmaz tatil deneyimleri
        </p>

        {/* Arama formu */}
        <SearchForm />
      </div>
    </div>
  </div>

  {/* Alt scroll indicator */}
  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
    <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center pt-2">
      <div className="w-1 h-2 bg-white/60 rounded-full" />
    </div>
  </div>
</section>
```

### 3.2 Arama Formu — Yüzen kart tarzı
```tsx
// components/SearchForm.tsx
<div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-2
  border border-white/50" style={{ zIndex: 100 }}>
  <div className="flex flex-col md:flex-row gap-0">
    {/* Giriş Tarihi */}
    <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl
      transition-colors relative" onClick={() => setAcikPanel('giris')}>
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-1">
        <Calendar size={12} /> GİRİŞ TARİHİ
      </div>
      <div className="text-gray-900 font-medium">
        {girisTarihi ? format(girisTarihi, 'd MMM yyyy', {locale: tr}) : 'Tarih seçin'}
      </div>
    </div>

    <div className="w-px bg-gray-200 self-stretch" /> {/* ayırıcı */}

    {/* Çıkış Tarihi */}
    <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-1">
        <Calendar size={12} /> ÇIKIŞ TARİHİ
      </div>
      <div className="text-gray-900 font-medium">
        {cikisTarihi ? format(cikisTarihi, 'd MMM yyyy', {locale: tr}) : 'Tarih seçin'}
      </div>
    </div>

    <div className="w-px bg-gray-200 self-stretch" />

    {/* Misafir */}
    <div className="flex-1 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl
      transition-colors relative" onClick={() => setAcikPanel('misafir')}>
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-1">
        <Users size={12} /> MİSAFİR
      </div>
      <div className="text-gray-900 font-medium">
        {toplamMisafir > 0 ? `${yetiskin} yetişkin${cocuk > 0 ? `, ${cocuk} çocuk` : ''}` : 'Kişi ekle'}
      </div>
      {/* Misafir dropdown — zIndex: 9999 */}
      {acikPanel === 'misafir' && <MisafirDropdown />}
    </div>

    {/* Ara butonu */}
    <button className="btn-primary m-1 px-8 whitespace-nowrap rounded-xl" onClick={ara}>
      <Search size={18} className="inline mr-2" />
      Villa Ara
    </button>
  </div>

  {/* Takvim popup — FORM DIŞINDA, portal ile render et */}
  {acikPanel === 'giris' || acikPanel === 'cikis' && (
    <div className="absolute top-full left-0 mt-3 bg-white rounded-2xl shadow-2xl
      border border-gray-100 p-4" style={{ zIndex: 9999 }}>
      <DayPicker
        mode="range"
        selected={{ from: girisTarihi, to: cikisTarihi }}
        onSelect={handleSelect}
        locale={tr}
        numberOfMonths={2}
        disabled={{ before: new Date() }}
        // dolu günler kırmızı
        modifiers={{ dolu: doluGunler }}
        modifiersStyles={{ dolu: { backgroundColor: '#FEE2E2', color: '#991B1B', textDecoration: 'line-through' } }}
      />
    </div>
  )}
</div>
```

### 3.3 İstatistik bandı — hero altında
```tsx
<div className="bg-white border-b border-gray-100 py-5">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
      {[
        { num: '500+', label: 'Mutlu Misafir', icon: '😊' },
        { num: '50+', label: 'Onaylı Villa', icon: '🏠' },
        { num: '20+', label: 'Özel Tekne', icon: '⛵' },
        { num: '4.9', label: 'Ortalama Puan', icon: '⭐' },
        { num: 'TURSAB', label: 'Güvenceli', icon: '✅' },
      ].map(({ num, label, icon }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="font-bold text-lg text-gray-900 leading-none">{num}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
```

### 3.4 Özellikler bandı — rakiplerden farklılaş
```tsx
{/* Gradient arka plan — mavi-yeşil */}
<section className="py-16" style={{
  background: 'linear-gradient(135deg, #0C4A6E 0%, #0EA5E9 50%, #16A34A 100%)'
}}>
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[
        { icon: Shield, title: 'SSL Güvenli Ödeme', desc: '256-bit şifreleme' },
        { icon: CheckCircle, title: 'Admin Onaylı', desc: 'Her ilan incelendi' },
        { icon: MessageCircle, title: '7/24 Destek', desc: 'WhatsApp & telefon' },
        { icon: Award, title: 'TURSAB Belgeli', desc: 'Belge No: 14382' },
      ].map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-start gap-4 bg-white/10 backdrop-blur-sm
          rounded-2xl p-5 border border-white/20">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-white">{title}</div>
            <div className="text-white/70 text-sm mt-0.5">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

### 3.5 Villa kartları — premium tasarım
```tsx
// components/VillaKart.tsx
<Link href={`/konaklama/${ilan.slug ?? ilan.id}`} className="villa-card block group">
  {/* Görsel */}
  <div className="card-image relative aspect-[4/3]">
    <Image src={kapakGorsel} alt={ilan.baslik} fill className="object-cover" />

    {/* Üst rozetler */}
    <div className="absolute top-3 left-3 flex gap-2">
      {ilan.sponsorlu && (
        <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
          ⭐ Öne Çıkan
        </span>
      )}
    </div>

    {/* Favori */}
    <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm
      rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
      <Heart size={16} className="text-gray-400 hover:text-red-500 transition-colors" />
    </button>

    {/* Alt gradient — fiyat overlayı için */}
    <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/60 to-transparent
      opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>

  {/* İçerik */}
  <div className="p-5">
    <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
      <MapPin size={11} />
      <span>{ilan.konum}</span>
    </div>

    <h3 className="font-bold text-gray-900 mb-3 line-clamp-1 text-[15px]">{ilan.baslik}</h3>

    {/* Özellikler */}
    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
      <span className="flex items-center gap-1.5"><Bed size={13}/> {ilan.yatak_odasi} oda</span>
      <span className="flex items-center gap-1.5"><Bath size={13}/> {ilan.banyo} banyo</span>
      <span className="flex items-center gap-1.5"><Users size={13}/> {ilan.kapasite} kişi</span>
    </div>

    {/* Puan + Fiyat */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Star size={13} className="text-amber-400 fill-amber-400" />
        <span className="text-sm font-semibold text-gray-900">{puan ?? '5.0'}</span>
        <span className="text-xs text-gray-400">({yorumSayisi ?? 0})</span>
      </div>
      <div className="text-right">
        {geceSayisi ? (
          <div>
            <span className="font-bold text-gray-900">
              ₺{((ilan.gunluk_fiyat * geceSayisi) + ilan.temizlik_ucreti).toLocaleString('tr-TR')}
            </span>
            <span className="text-xs text-gray-400 block">{geceSayisi} gece toplam</span>
          </div>
        ) : (
          <div>
            <span className="font-bold text-gray-900">
              ₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}
            </span>
            <span className="text-xs text-gray-400"> / gece</span>
          </div>
        )}
      </div>
    </div>
  </div>
</Link>
```

### 3.6 Bölge kartları — harita overlay tarzı
```tsx
<section className="py-20 bg-gray-950">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-12">
      <h2 className="heading-section text-white mb-3">Fethiye'yi Keşfedin</h2>
      <p className="text-gray-400">Eşsiz güzellikleriyle her bölge farklı bir tatil vaat ediyor</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {bolgeler.map(bolge => (
        <Link href={`/konaklama?konum=${bolge.slug}`} key={bolge.slug}
          className="relative rounded-2xl overflow-hidden aspect-[4/3] group cursor-pointer">
          <Image src={bolge.gorsel} alt={bolge.isim} fill className="object-cover
            group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="font-bold text-white text-lg">{bolge.isim}</div>
            <div className="text-white/70 text-sm">{bolge.ilanSayisi} villa</div>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white text-gray-900 font-semibold px-4 py-2 rounded-full text-sm">
              Villaları Gör →
            </span>
          </div>
        </Link>
      ))}
    </div>
  </div>
</section>
```

### 3.7 Yorum kartları — premium
```tsx
<section className="py-20 bg-white">
  <div className="max-w-7xl mx-auto px-6">
    <div className="text-center mb-12">
      <h2 className="heading-section text-gray-900 mb-3">Misafirlerimiz Ne Diyor?</h2>
      <div className="flex items-center justify-center gap-2">
        {[1,2,3,4,5].map(i => <Star key={i} size={20} className="text-amber-400 fill-amber-400" />)}
        <span className="ml-2 font-bold text-gray-900">4.9/5</span>
        <span className="text-gray-500">— 120+ değerlendirme</span>
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {yorumlar.map(yorum => (
        <div key={yorum.id} className="bg-gray-50 rounded-2xl p-6 relative">
          {/* Büyük tırnak */}
          <div className="text-8xl text-sky-100 font-serif absolute top-4 right-6 leading-none select-none">"</div>
          <div className="flex mb-3">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={14} className={i <= yorum.puan ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
            ))}
          </div>
          <p className="text-gray-700 leading-relaxed mb-4 relative z-10">"{yorum.yorum}"</p>
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center
              text-white font-bold text-sm">
              {yorum.kullanici_adi?.[0] ?? 'M'}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{yorum.kullanici_adi ?? 'Misafir'}</div>
              <div className="text-xs text-gray-400">{yorum.ilan_adi}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

---

## BÖLÜM 4 — RAKİP SİTELERDE OLUP BİZDE OLMAYAN ÖZELLİKLER

### 4.1 Erken rezervasyon banner'ı (garantivillam.com'da var)
```tsx
// Ana sayfa hero altında veya üstünde:
<div className="bg-amber-400 text-amber-900 py-3 text-center text-sm font-semibold">
  🎉 2026 Yaz Sezonu Erken Rezervasyon Fırsatı — %15'e kadar indirim! 
  <Link href="/konaklama" className="underline ml-2">Hemen İncele →</Link>
</div>
```

### 4.2 Villa kategorileri sayfası (hepsivilla.com'da var)
Yeni kategoriler ekle:
- **Korunaklı/Muhafazakâr Villalar** — mahremiyet odaklı
- **Isıtmalı Havuzlu Villalar** — kış tatili
- **Balayı Villaları** — çift + romantik
- **Denize Sıfır Villalar** — plaj erişimi
- **Büyük Kapasite (10+ kişi)** — kalabalık gruplar

```tsx
// /konaklama sayfası filtre sidebar'ına ekle:
// "Özel Kategoriler" bölümü
<div className="space-y-2">
  <h4 className="font-semibold text-gray-900 text-sm">Özel Kategoriler</h4>
  {ozelKategoriler.map(kategori => (
    <label key={kategori.slug} className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" className="rounded" />
      <span className="text-sm text-gray-700">{kategori.isim}</span>
    </label>
  ))}
</div>
```

### 4.3 Fiyat karşılaştırma bandı (tatildekirala.com'dan ilham)
```tsx
// İlan detay sayfasına ekle:
<div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
  <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
    <TrendingDown size={16} /> Kişi başına maliyet hesabı
  </div>
  <p className="text-sm text-green-600">
    {misafirSayisi} kişi için: <strong>₺{(toplamFiyat / misafirSayisi).toLocaleString('tr-TR')}</strong> kişi başı
    — 5 yıldızlı otel fiyatlarına kıyasla %40 daha uygun
  </p>
</div>
```

### 4.4 Gün gün fiyat takvimi (villakiralama.com'da var)
İlan detay sayfasında takvimde her günün üzerine fiyatını yaz:
```tsx
// DayPicker custom day render:
<DayPicker
  components={{
    Day: ({ date, ...props }) => {
      const fiyat = gunlukFiyatlar[format(date, 'yyyy-MM-dd')]
      return (
        <td {...props}>
          <button className="relative w-10 h-10 flex flex-col items-center justify-center">
            <span className="text-sm">{date.getDate()}</span>
            {fiyat && <span className="text-[9px] text-sky-600 leading-none">{(fiyat/1000).toFixed(1)}k</span>}
          </button>
        </td>
      )
    }
  }}
/>
```

### 4.5 WhatsApp hızlı teklif formu (garantivillam.com'da var)
```tsx
// Her ilan kartının altına ekle:
<a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Merhaba, ${encodeURIComponent(ilan.baslik)} hakkında bilgi almak istiyorum.`}
  className="flex items-center gap-2 text-green-600 text-sm font-medium hover:text-green-700">
  <MessageCircle size={14} /> WhatsApp ile fiyat al
</a>
```

### 4.6 Son görüntülenen ilanlar (Airbnb'de var)
```tsx
// localStorage'a kaydet, ana sayfada göster:
// "Son Baktıklarınız" bölümü — horizontal scroll
```

### 4.7 Fiyat alarmı / Bildirim (ETS Tur'dan ilham)
```tsx
// İlan detay sayfasına ekle:
<button className="w-full border-2 border-sky-200 text-sky-600 rounded-xl py-3
  hover:bg-sky-50 transition-colors font-medium">
  🔔 Fiyat düşünce bildir
</button>
```

### 4.8 İlana soru sor (hepsivilla.com'da var)
```tsx
// İlan detay sayfasına ekle — soru-cevap bölümü:
<div className="border-t pt-6">
  <h3 className="font-bold text-lg mb-4">Soru & Cevap</h3>
  <div className="bg-gray-50 rounded-xl p-4 mb-4">
    <textarea placeholder="Bu ilan hakkında soru sorun..."
      className="w-full bg-transparent resize-none text-sm focus:outline-none" rows={2} />
    <button className="btn-primary text-sm py-2 px-4 mt-2">Soru Sor</button>
  </div>
</div>
```

### 4.9 Benzer fiyat alternatifi
```tsx
// Fiyat kartının altına ekle:
<p className="text-xs text-gray-400 text-center mt-2">
  Benzer villalar: ₺{(ilan.gunluk_fiyat * 0.8).toLocaleString('tr-TR')} – ₺{(ilan.gunluk_fiyat * 1.3).toLocaleString('tr-TR')}/gece
</p>
```

---

## BÖLÜM 5 — /konaklama SAYFASI İYİLEŞTİRME

### 5.1 Harita görünümü butonu
```tsx
// Listenin üstüne ekle:
<div className="flex gap-2">
  <button className={`px-4 py-2 rounded-xl text-sm font-medium ${goruntu === 'liste' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'}`}
    onClick={() => setGoruntu('liste')}>
    <Grid size={14} className="inline mr-1" /> Liste
  </button>
  <button className={`px-4 py-2 rounded-xl text-sm font-medium ${goruntu === 'harita' ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-700'}`}
    onClick={() => setGoruntu('harita')}>
    <Map size={14} className="inline mr-1" /> Harita
  </button>
</div>
```

### 5.2 Filtre bandı — üstte pills tarzı
```tsx
// Aktif filtreleri üstte chip olarak göster:
{aktifFiltreler.map(filtre => (
  <span key={filtre} className="inline-flex items-center gap-1 bg-sky-100 text-sky-700
    rounded-full px-3 py-1 text-sm font-medium">
    {filtre}
    <button onClick={() => filtreSil(filtre)}><X size={12} /></button>
  </span>
))}
```

### 5.3 Sıralama dropdown
```tsx
<select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
  <option>Önerilen</option>
  <option>Fiyat (Artan)</option>
  <option>Fiyat (Azalan)</option>
  <option>En Yüksek Puan</option>
  <option>En Çok Yorumlanan</option>
  <option>En Yeni</option>
</select>
```

---

## BÖLÜM 6 — ANİMASYONLAR & MİKRO-ETKİLEŞİMLER

`npm install framer-motion` (yoksa)

```tsx
// 1. Sayfa yüklenme animasyonu
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
}

// 2. Villa kartları — stagger (sırayla gelsin)
const container = {
  animate: { transition: { staggerChildren: 0.08 } }
}
const cardVariant = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

// 3. Sayaç animasyonu (istatistikler)
// useCountUp hook'u yaz — görünüme girince 0'dan hedefe

// 4. Paralaks effect (hero'da)
// video scroll'da yavaşça kayar

// 5. Hero başlık — letter reveal animasyonu
// Her harf 20ms gecikmeyle belirir
```

---

## BÖLÜM 7 — MOBİL İYİLEŞTİRMELER

```tsx
// 1. İlan detay sticky bottom bar (mobil):
<div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4 
  flex items-center gap-3 md:hidden z-50">
  <div className="flex-1">
    <div className="font-bold text-gray-900">₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}</div>
    <div className="text-xs text-gray-500">/ gece</div>
  </div>
  <Link href={rezervasyonUrl} className="btn-primary flex-1 text-center py-3 text-sm">
    Rezervasyon Yap
  </Link>
  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="btn-whatsapp px-4 py-3 rounded-xl">
    <Phone size={18} />
  </a>
</div>

// 2. WhatsApp fixed butonu:
<a href={`https://wa.me/${WHATSAPP_NUMBER}`}
  className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-green-500 rounded-full
  flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors
  md:bottom-8 animate-[wiggle_2s_ease-in-out_infinite]">
  <MessageCircle size={24} className="text-white" />
</a>

// globals.css'e wiggle animation ekle:
@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg) scale(1); }
  50% { transform: rotate(3deg) scale(1.05); }
}

// 3. Arama formu mobilde dikey:
// flex-col on mobile, flex-row on md+

// 4. Filtre sidebar — bottom sheet:
// Mobilde "Filtrele" butonu → alttan kayar drawer
```

---

## BÖLÜM 8 — TÜRKÇE KARAKTER & MARKA DÜZELTMELERİ

```bash
# Tüm kaynak dosyalarda toplu değiştir:
find app/ components/ -name "*.tsx" -o -name "*.ts" | \
xargs sed -i \
  -e 's/Oludeniz/Ölüdeniz/g' \
  -e 's/Gocek/Göcek/g' \
  -e 's/Hisaronu/Hisarönü/g' \
  -e 's/Kayakoy/Kayaköy/g' \
  -e 's/Calis/Çalış/g' \
  -e 's/Gulet/Gület/g' \
  -e 's/Luks/Lüks/g' \
  -e 's/Ozel/Özel/g' \
  -e 's/Kacamak/Kaçamak/g' \
  -e 's/Ice Ice/İçe İçe/g' \
  -e 's/Sezondakirala\b/SezondalKirala/g'
```

Ayrıca `lib/constants.ts`'te:
```ts
export const SITE_NAME = 'SezondalKirala'  // büyük K
```

---

## BÖLÜM 9 — FOOTER & HEADER İYİLEŞTİRME

### 9.1 Header scroll efekti
```tsx
// Scroll'da transparan → blur beyaz geçiş
const [scrolled, setScrolled] = useState(false)
useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 50)
  window.addEventListener('scroll', handler)
  return () => window.removeEventListener('scroll', handler)
}, [])

<header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
  scrolled
    ? 'bg-white/95 backdrop-blur-xl shadow-sm'
    : 'bg-transparent'
}`}>
  {/* Logo rengi de değişir */}
  <span className={`font-bold text-xl transition-colors ${scrolled ? 'text-sky-600' : 'text-white'}`}>
    SezondalKirala
  </span>
</header>
```

### 9.2 Footer wave divider
```tsx
// Footer üstüne dalga SVG ekle:
<div className="overflow-hidden">
  <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" className="block">
    <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
      fill="#0F172A" />
  </svg>
</div>
<footer className="bg-[#0F172A]">
  {/* footer içeriği */}
</footer>
```

---

## SONUNDA

```bash
npm run build && npm run lint
```

Test listesi:
1. ✅ Video arka plan tam ekranı kaplıyor mu, taşma yok mu?
2. ✅ Takvim tıklandığında popup üstte görünüyor mu, arkada kalmıyor mu?
3. ✅ Header scroll'da beyaza dönüyor mu?
4. ✅ Playfair Display font başlıklarda görünüyor mu?
5. ✅ Villa kartları hover'da yukarı kalkıyor mu?
6. ✅ Bölge kartları hover'da "Villaları Gör" butonu çıkıyor mu?
7. ✅ Mobilde sticky bottom bar görünüyor mu?
8. ✅ WhatsApp butonu sallanma animasyonuyla görünüyor mu?
9. ✅ "Ölüdeniz", "Göcek", "Hisarönü" vb. düzgün yazılıyor mu?
10. ✅ Header'da "SezondalKirala" (büyük K) yazıyor mu?
