# SezondalKirala — V9 Kapsamlı Düzeltme & Geliştirme Promptu

Siteyi detaylı inceledim. Aşağıdaki tüm sorunları sırayla düzelt. Her bölüm sonrası `npm run build` al.

---

## BÖLÜM 1 — HERO VİDEO BOYUTU (KRİTİK)

### 1.1 Video çok büyük görünüyor — hero yüksekliğini düşür

Şu an `min-h-screen` veya `100vh` kullanılıyor, video çok uzun. Şu değerlere çek:

```tsx
// Hero section — video için ideal boyut
<section className="relative w-full overflow-hidden" style={{ height: '75vh', minHeight: '520px', maxHeight: '700px' }}>
  <div className="absolute inset-0">
    <video
      autoPlay loop muted playsInline
      className="absolute inset-0 w-full h-full object-cover object-center"
    >
      <source src="/videos/video.mp4" type="video/mp4" />
    </video>
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.75) 100%)'
    }} />
  </div>
  <div className="relative h-full flex flex-col items-center justify-center px-4 text-center"
    style={{ zIndex: 10 }}>
    {/* içerik */}
  </div>
</section>
```

Mobilde daha da küçük:
```css
@media (max-width: 768px) {
  .hero-section { height: 60vh !important; min-height: 450px !important; }
}
```

### 1.2 Video mobilde görünmüyor — düzelt

**Sorun:** Mobil cihazlarda (iOS Safari özellikle) `autoPlay` video çalışmıyor veya hiç görünmüyor.

**Çözüm — tüm bu attribute'ları ekle:**
```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
  disablePictureInPicture
  disableRemotePlayback
  x-webkit-airplay="deny"
  className="absolute inset-0 w-full h-full object-cover object-center"
  style={{ WebkitBackfaceVisibility: 'hidden' }}
>
  <source src="/videos/video.mp4" type="video/mp4" />
</video>
```

**iOS Safari için kritik notlar:**
- `muted` ve `playsInline` olmadan iOS'ta autoPlay çalışmaz — ikisi de zorunlu
- `preload="auto"` videoyu önceden yükler
- `disablePictureInPicture` ve `disableRemotePlayback` gereksiz kontrolleri engeller

**Mobilde video yüklenemezse fallback görsel göster:**
```tsx
'use client'
import { useRef, useEffect, useState } from 'react'

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoHata, setVideoHata] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    // Video oynatılamıyorsa fallback göster
    const handleError = () => setVideoHata(true)
    
    // iOS için manuel play denemesi
    video.play().catch(() => setVideoHata(true))
    
    video.addEventListener('error', handleError)
    return () => video.removeEventListener('error', handleError)
  }, [])

  if (videoHata) {
    // Video çalışmazsa güzel bir gradient fallback
    return (
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #0C4A6E 0%, #0EA5E9 40%, #16A34A 100%)'
      }} />
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay loop muted playsInline preload="auto"
      disablePictureInPicture
      className="absolute inset-0 w-full h-full object-cover object-center"
      style={{ WebkitBackfaceVisibility: 'hidden' }}
    >
      <source src="/videos/video.mp4" type="video/mp4" />
    </video>
  )
}
```

**globals.css'e ekle:**
```css
/* iOS video fix */
video {
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* Mobilde video container */
@media (max-width: 768px) {
  .hero-video-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
  }
}
```

**next.config.js'e header ekle (video cache):**
```js
async headers() {
  return [
    {
      source: '/videos/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        { key: 'Accept-Ranges', value: 'bytes' }, // Video streaming için kritik
      ],
    },
  ]
},
```

`Accept-Ranges: bytes` header'ı olmadan bazı mobil tarayıcılar videoyu yükleyemiyor.

---

## BÖLÜM 2 — ANA SAYFA SORUNLARI

### 2.1 Türkçe karakter sorunları — tüm sayfada
Ana sayfada hâlâ bozuk metinler var:
- "Kayakoy tas evinde" → "Kayaköy taş evinde"
- "Oludeniz turu" → "Ölüdeniz turu"
- "Luks Villa" → "Lüks Villa"
- "Ozel Gulet" → "Özel Gület"
- "Gocekteki" → "Göcekteki"
- "Calistaki" → "Çalıştaki"
- "Hisaronunde" → "Hisarönünde"
- "Dogayla Ice Tatil" → "Doğayla İçe İçe Tatil"
- "Kacamak" → "Kaçamak"
- "Muhtesem" → "Muhteşem"
- "essizdi" → "eşsizdi"

Tüm `.tsx` dosyalarında bu kelimeleri bul ve değiştir.

### 2.2 Aile paketi kartı bozuk
Ana sayfada Aile Tatil Paketi kartının içeriği yanlış yerde render ediliyor — fiyat ve açıklama başka kartın altında çıkıyor. Paket kartlarını map ile düzgün render et, her kartın kendi içeriği kendinde olsun.

### 2.3 Yorum kartlarında kullanıcı adı yok
"Sezondakirala Misafiri" yazıyor. `yorumlar` tablosundan `kullanicilar.ad_soyad` join ile çek ve göster. Yoksa "Misafir" yaz.

### 2.4 İstatistik bandı WhatsApp numarası
Footer'da `+90 (XXX) XXX XX XX` yazıyor. `lib/constants.ts`'teki `WHATSAPP_NUMBER` ile değiştir.

### 2.5 "Ne Tür Tatil?" bölümünde Aile kategorisi eksik
Şu an 3 kategori var (Macera, Lüks, Romantik). Aile kategorisini de ekle:
```tsx
{ slug: 'aile', label: 'Aile', desc: 'Herkes İçin Eğlence', emoji: '👨‍👩‍👧‍👦' }
```

---

## BÖLÜM 3 — İLAN DETAY SAYFASI SORUNLARI

### 3.1 Takvimde fiyatlar yanlış gösteriliyor
Takvimde her günün üzerinde `4.5k`, `14.5k`, `24.5k`... gibi artan sayılar görünüyor — bunlar birikim fiyatı, her gün için tek tek gecelik fiyat gösterilmeli. Takvim custom day renderer'ını düzelt:

```tsx
// Her gün için sadece o günün gecelik fiyatını göster
const gunFiyati = sezonFiyatlari[format(date, 'yyyy-MM-dd')] ?? ilan.gunluk_fiyat
// Gösterim: "4.5k" (gecelik fiyat)
const gosterim = `${(gunFiyati/1000).toFixed(1)}k`
```

### 3.2 İlan detay sayfası "yükleniyor" gösteriyor
`/konaklama/[id]` sayfası açılınca "SezondalKirala yükleniyor" yazısı çıkıyor ve içerik gecikiyor. Loading state'i düzelt — Suspense veya skeleton kullan, "yükleniyor" yazısı yerine shimmer göster.

### 3.3 Galeri iyileştirme
- Sol/sağ ok butonları çalışıyor mu kontrol et
- Mobilde swipe çalışıyor mu kontrol et
- "Tüm fotoğrafları gör" butonu lightbox açıyor mu kontrol et

### 3.4 WhatsApp mesaj metni Türkçe karakter sorunu
`wa.me` linkindeki metin URL encode edilmeli:
```tsx
const mesaj = encodeURIComponent(`Merhaba, ${ilan.baslik} hakkında bilgi almak istiyorum.`)
href={`https://wa.me/${WHATSAPP_NUMBER}?text=${mesaj}`}
```

### 3.5 Rezervasyon butonu giriş yönlendirmesi
"Rezervasyon Yap" tıklanınca giriş sayfasına yönlendiriyor — bu doğru. Ama giriş sonrası tarih ve misafir parametrelerinin korunması lazım:
```tsx
const redirect = encodeURIComponent(`/rezervasyon/${ilan.id}?giris=${giris}&cikis=${cikis}&yetiskin=${yetiskin}&cocuk=${cocuk}`)
href={`/giris?redirect=${redirect}`}
```

---

## BÖLÜM 4 — GİRİŞ & KAYIT SAYFALARI

### 4.1 Giriş sayfası görsel olarak çok boş
Şu an sadece başlık + 2 input var. İki kolonlu layout yap:

```tsx
// app/giris/page.tsx
<div className="min-h-screen grid lg:grid-cols-2">
  {/* Sol: Fethiye görseli + slogan */}
  <div className="hidden lg:flex relative overflow-hidden">
    <Image src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200"
      alt="Fethiye" fill className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-br from-sky-900/80 to-green-900/60" />
    <div className="relative z-10 flex flex-col justify-end p-12 text-white">
      <div className="text-4xl font-bold mb-3">Fethiye'nin En Güzel<br/>Villalarını Keşfet</div>
      <p className="text-white/70">500+ onaylı villa ve tekne ile unutulmaz tatil deneyimi</p>
      <div className="flex items-center gap-2 mt-6 bg-white/10 rounded-xl p-3 w-fit">
        <Shield size={16} className="text-green-400" />
        <span className="text-sm">TURSAB Belgeli — Güvenli Kiralama</span>
      </div>
    </div>
  </div>

  {/* Sağ: Form */}
  <div className="flex items-center justify-center p-8 bg-gray-50">
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold">SK</div>
            <span className="font-bold text-gray-900">SezondalKirala</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Tekrar Hoş Geldiniz</h1>
          <p className="text-gray-500 text-sm mt-1">Hesabınıza giriş yapın</p>
        </div>
        <GirisForm />
        <p className="text-center text-sm text-gray-500 mt-6">
          Hesabın yok mu?{' '}
          <Link href="/kayit" className="text-sky-600 font-medium hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  </div>
</div>
```

### 4.2 Kayıt sayfası — rol seçimi ve eksik alanlar
Şu an sadece email, şifre, şifre tekrarı var. Şunları ekle:

```tsx
// Zorunlu alanlar:
// 1. Ad Soyad
// 2. Telefon (05XX XXX XX XX formatı)
// 3. E-posta
// 4. Şifre (güç göstergesi ile)
// 5. Şifre tekrarı
// 6. Hesap türü (büyük seçim kartları):
//    🏖️ Tatilci — "Villa veya tekne kiralamak istiyorum"
//    🏠 İlan Sahibi — "Villam var, kiraya vermek istiyorum"
// 7. Kullanım koşulları checkbox

// Kayıt sonrası kullanicilar tablosuna ad_soyad, telefon, rol ekle
// ziyaretci → ana sayfaya
// ilan_sahibi → /panel/ilanlarim
```

### 4.3 Giriş/Kayıt formları Türkçe karakter sorunu
- "Giris Yap" → "Giriş Yap"
- "Kayit Ol" → "Kayıt Ol"
- "Sifre" → "Şifre"
- "Hesabiniza giris yaparak" → "Hesabınıza giriş yaparak"
- "Yeni hesap olusturarak" → "Yeni hesap oluşturarak"

---

## BÖLÜM 5 — HAKKIMIZDA SAYFASI — TAMAMEN YENİDEN YAZ

Şu an sadece 1 satır metin var. Tamamen yeniden yaz:

```tsx
// app/hakkimizda/page.tsx

// 1. HERO — büyük başlık + Fethiye görseli
<section className="relative h-64 md:h-96">
  <Image src="fethiye görseli" fill className="object-cover" />
  <div className="absolute inset-0 bg-black/50" />
  <div className="relative z-10 flex items-center justify-center h-full text-center text-white">
    <div>
      <h1 className="text-4xl md:text-6xl font-bold">Hakkımızda</h1>
      <p className="text-white/70 mt-3">Fethiye'nin güvenilir tatil platformu</p>
    </div>
  </div>
</section>

// 2. HİKAYEMİZ — 2 kolon
<section className="py-16 max-w-6xl mx-auto px-6">
  <div className="grid md:grid-cols-2 gap-12 items-center">
    <div>
      <h2 className="text-3xl font-bold mb-4">Hikayemiz</h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        SezondalKirala, Fethiye'nin eşsiz güzelliklerini her tatilciyle buluşturma
        hayaliyle kuruldu. Villa ve tekne kiralama sürecini şeffaf, güvenli ve
        kolay hale getirmek için çalışıyoruz.
      </p>
      <p className="text-gray-600 leading-relaxed">
        TURSAB çatısı altında lisanslı bir platform olarak, hem ilan sahiplerine
        hem de tatilcilere en iyi deneyimi sunmayı hedefliyoruz.
      </p>
    </div>
    <div className="rounded-2xl overflow-hidden">
      <Image src="fethiye görseli 2" alt="Fethiye" width={600} height={400} className="object-cover" />
    </div>
  </div>
</section>

// 3. RAKAMLAR — animasyonlu sayaçlar
<section className="py-16 bg-gray-50">
  <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    {[
      { num: '500+', label: 'Mutlu Misafir' },
      { num: '50+', label: 'Onaylı Villa' },
      { num: '20+', label: 'Özel Tekne' },
      { num: '%98', label: 'Memnuniyet' },
    ].map(({ num, label }) => (
      <div key={label}>
        <div className="text-4xl font-bold text-sky-600">{num}</div>
        <div className="text-gray-500 mt-1">{label}</div>
      </div>
    ))}
  </div>
</section>

// 4. TURSAB GÜVEN BÖLÜMÜ
<section className="py-16 max-w-6xl mx-auto px-6">
  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
    <div className="w-24 h-24 bg-sky-100 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
      🏆
    </div>
    <div>
      <h3 className="text-xl font-bold text-sky-900 mb-2">TURSAB Güvencesi</h3>
      <p className="text-sky-700">
        SezondalKirala, Türkiye Seyahat Acenteleri Birliği (TURSAB) üyesidir.
        Belge No: 14382 ile tüm işlemleriniz yasal güvence altındadır.
      </p>
    </div>
  </div>
</section>

// 5. İLETİŞİM CTA
<section className="py-16 bg-gradient-to-br from-sky-500 to-green-500 text-white text-center">
  <h2 className="text-3xl font-bold mb-4">Sorularınız İçin Bize Ulaşın</h2>
  <p className="text-white/80 mb-8">7/24 WhatsApp desteğimizle yanınızdayız</p>
  <a href={`https://wa.me/${WHATSAPP_NUMBER}`}
    className="bg-white text-sky-600 font-bold px-8 py-4 rounded-2xl inline-flex items-center gap-2">
    WhatsApp ile İletişim Kur
  </a>
</section>
```

---

## BÖLÜM 6 — KONAKlAMA & TEKNELER SAYFASI

### 6.1 Filtre sidebar çok basit
Şu an sadece 3 checkbox var (WiFi, Havuz, Klima) ve "Filtrele" butonu. Genişlet:

```tsx
// Filtre bölümleri:

// 1. Fiyat aralığı
<div>
  <label className="font-semibold text-sm">Fiyat Aralığı (gecelik)</label>
  <div className="flex gap-2 mt-2">
    <input type="number" placeholder="Min ₺" className="form-input flex-1" />
    <input type="number" placeholder="Max ₺" className="form-input flex-1" />
  </div>
</div>

// 2. Kapasite
<div>
  <label className="font-semibold text-sm">Kapasite</label>
  <div className="grid grid-cols-2 gap-2 mt-2">
    {['1-2 Kişi', '3-4 Kişi', '5-6 Kişi', '7+ Kişi'].map(k => (
      <button key={k} className="border rounded-xl py-2 text-sm hover:border-sky-500 hover:text-sky-600">
        {k}
      </button>
    ))}
  </div>
</div>

// 3. Konum
<div>
  <label className="font-semibold text-sm">Bölge</label>
  <div className="space-y-2 mt-2">
    {['Ölüdeniz', 'Çalış', 'Göcek', 'Hisarönü', 'Kayaköy', 'Fethiye Merkez'].map(b => (
      <label key={b} className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="rounded" />
        <span className="text-sm">{b}</span>
      </label>
    ))}
  </div>
</div>

// 4. Özellikler (mevcut 3'e ek olarak)
// Havuz, WiFi, Klima, Deniz Manzarası, Bahçe, BBQ, Jakuzi, Evcil Hayvan
```

### 6.2 Filtreler URL'e yansısın
```tsx
// Filtrele butonuna basınca URL güncelle:
router.push(`/konaklama?wifi=${wifi}&havuz=${havuz}&fiyat_min=${min}&fiyat_max=${max}&konum=${konum}&kapasite=${kapasite}`)
// Sayfa yenilenince filtreler korunsun
```

### 6.3 Sıralama dropdown ekle
```tsx
<select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
  <option value="onerilen">Önerilen</option>
  <option value="fiyat_artan">Fiyat (Artan)</option>
  <option value="fiyat_azalan">Fiyat (Azalan)</option>
  <option value="en_yeni">En Yeni</option>
</select>
```

---

## BÖLÜM 7 — PAKETLER SAYFASI

### 7.1 Türkçe karakter düzeltmeleri
- "Luks" → "Lüks"
- "Ozel Gulet" → "Özel Gület"
- "Gocekteki" → "Göcekteki"
- "Calistaki" → "Çalıştaki"
- "Balayi" → "Balayı"
- "Macera", "Romantik", "Aile" — kategori badge'leri büyük harf, renkli olsun

### 7.2 Paket kartı tasarımı iyileştirme
Her pakette şunlar görünmeli:
- Kategori badge (renkli pill)
- Başlık
- Açıklama (2 satır max)
- Süre ve kapasite (ikonlu)
- Toplam fiyat (büyük)
- "İncele →" butonu (tıklanabilir)

---

## BÖLÜM 8 — SSS SAYFASI

SSS sayfası iyi görünüyor ama tasarım çok sade. İyileştir:

```tsx
// Hero bölümü ekle
<div className="bg-gradient-to-br from-sky-50 to-green-50 py-16 text-center">
  <h1 className="text-4xl font-bold mb-3">Sıkça Sorulan Sorular</h1>
  <p className="text-gray-600">Merak ettiğiniz her şey burada</p>
</div>

// Accordion daha iyi görünüm
// Açık olan accordion mavi border ve açık mavi arka plan
// Her soru önünde soru işareti ikonu
// Cevaplar daha detaylı olsun (şu an çok kısa)
```

---

## BÖLÜM 9 — HEADER İYİLEŞTİRMELERİ

### 9.1 Header tutarsızlığı
Bazı sayfalarda (hakkimizda, giris) eski header görünüyor: "Giris Yap", "Kayit Ol" — Türkçe karakter yok, yeni dropdown menü yok.

Tüm sayfalarda aynı Header component kullanılıyor mu kontrol et. `app/layout.tsx`'teki Header mı yoksa sayfa bazlı mı? Tekil header component olsun.

### 9.2 Scroll efekti
Header scroll'da şeffaf → beyaz geçiş yapıyor mu? Kontrol et. Hero video üzerinde transparan, aşağı scroll'da beyaz olmalı.

---

## BÖLÜM 10 — MOBİL DÜZELTMELER

### 10.1 Hero video mobilde
```css
@media (max-width: 768px) {
  .hero-section {
    height: 60vh !important;
    min-height: 400px !important;
  }
}
```

### 10.2 Arama formu mobilde
Giriş-Çıkış, Misafir ve Ara butonu dikey (stacked) düzende olsun mobilde.

### 10.3 İlan kartları mobilde
- Tek kolon (1 kolon mobil, 2 tablet, 3 masaüstü)
- Fotoğraf aspect-ratio korunsun
- Butonlar tam genişlik olsun

### 10.4 Footer mobilde
4 kolon → 2 kolon (tablet) → 1 kolon (mobil)

---

## BÖLÜM 11 — GENEL TEMİZLİK

### 11.1 Tüm Türkçe karakter sorunlarını düzelt
Proje genelinde grep ile tara:
```bash
grep -rn "Oludeniz\|Gocek\|Hisaronu\|Kayakoy\|Calis\|Gulet\|Luks\|Ozel\|Balayi\|Muhtesem\|Sezondakirala\b" app/ components/ --include="*.tsx" --include="*.ts"
```
Bulduklarını düzelt.

### 11.2 Console log'ları temizle
```bash
grep -rn "console.log" app/ components/ --include="*.tsx" --include="*.ts"
```
Hepsini sil.

### 11.3 İletişim sayfası eksik
Footer'da `/iletisim` linki var ama sayfa yok. Basit bir iletişim sayfası oluştur:
- Adres, telefon, email bilgileri
- WhatsApp butonu
- Basit iletişim formu (ad, email, mesaj)
- Google Maps embed (Fethiye merkezi)

---

## BÖLÜM 12 — ADMİN & KULLANICI OTURUM ÇAKIŞMASI (KRİTİK)

### 12.0 Sorun
Admin paneline girildiğinde normal site header'ı ve kullanıcı session'ı görünüyor. Admin oturumu ile normal kullanıcı oturumu birbirine karışıyor. İkisi tamamen izole olmalı.

### 12.1 Ayrı Supabase client — admin için farklı storage key

Normal site ve admin paneli aynı Supabase session storage'ını paylaşıyor. Bunu ayır:

```tsx
// lib/supabase/admin-client.ts — admin için AYRI browser client
import { createBrowserClient } from '@supabase/ssr'

export function createAdminBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'sb-admin-auth-token', // Normal site 'sb-auth-token' kullanır, admin ayrı
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      }
    }
  )
}
```

```tsx
// lib/supabase/admin-server.ts — admin için AYRI server client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createAdminServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-admin-auth', // Normal site 'sb-auth' kullanır
      },
      cookies: {
        getAll() {
          return cookieStore.getAll().filter(c => c.name.startsWith('sb-admin'))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(`sb-admin-${name}`, value, options)
          })
        },
      },
    }
  )
}
```

### 12.2 Admin layout — normal site layout'undan tamamen izole et

`app/yonetim/layout.tsx` normal `app/layout.tsx`'ten **hiçbir şey** miras almamalı:

```tsx
// app/yonetim/layout.tsx
// Bu layout body tag'ini kendisi yönetir
// Normal site header, footer, provider'larından hiçbirini kullanmaz

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Panel | SezondalKirala',
  robots: 'noindex, nofollow', // Admin sayfaları Google'a indexlenmesin
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin server client kullan — normal site client'ı DEĞİL
  const supabase = createAdminServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // /yonetim/giris sayfasında layout kontrolü yapma
  const isGirisPage = /* pathname check */

  if (!isGirisPage) {
    if (!user) redirect('/yonetim/giris')
    const { data: k } = await supabase.from('kullanicilar').select('rol').eq('id', user.id).single()
    if (k?.rol !== 'admin') redirect('/yonetim/giris')
  }

  return (
    // NOT: Burada <html> ve <body> YOK — app/layout.tsx bunları yönetir
    // Sadece admin'e özel wrapper div
    <div className={`admin-root ${inter.className}`}
      style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 100%)', minHeight: '100vh' }}>
      {!isGirisPage && <AdminSidebar />}
      <div style={{ marginLeft: isGirisPage ? 0 : '260px' }}>
        {!isGirisPage && <AdminTopbar />}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
```

### 12.3 Admin giriş sayfası — normal site session'ından bağımsız

```tsx
// app/yonetim/giris/page.tsx
// Bu sayfa admin layout'undan ÖNCE çalışır, layout auth check yapmaz bu sayfada

// AdminGirisForm.tsx — 'use client'
'use client'
import { createAdminBrowserClient } from '@/lib/supabase/admin-client'

export function AdminGirisForm() {
  const adminSupabase = createAdminBrowserClient() // admin-specific client

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = await adminSupabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setHata('Geçersiz email veya şifre')
      return
    }

    // Rol kontrolü
    const { data: kullanici } = await adminSupabase
      .from('kullanicilar')
      .select('rol')
      .eq('id', data.user.id)
      .single()

    if (kullanici?.rol !== 'admin') {
      await adminSupabase.auth.signOut()
      setHata('Bu hesabın admin yetkisi yok')
      return
    }

    router.push('/yonetim')
    router.refresh()
  }
  // ...
}
```

### 12.4 Admin çıkış — sadece admin session'ını temizle

```tsx
// AdminSidebar veya AdminTopbar'daki çıkış butonu:
'use client'
import { createAdminBrowserClient } from '@/lib/supabase/admin-client'

const handleCikis = async () => {
  const adminSupabase = createAdminBrowserClient()
  await adminSupabase.auth.signOut() // Sadece admin token'ını temizler
  router.push('/yonetim/giris')
}
```

### 12.5 Normal site header — admin session'ından etkilenmesin

```tsx
// components/Header.tsx
'use client'
import { createClient } from '@/lib/supabase/client' // Normal site client — 'sb-auth-token'

// Admin 'sb-admin-auth-token' kullanır, normal site client bunu görmez
// Yani admin panelindeyken normal sitede giriş yapılmış gibi görünmez
```

### 12.6 Middleware — admin ve normal site route'larını ayrı tut

```tsx
// middleware.ts
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin route'ları
  if (pathname.startsWith('/yonetim')) {
    // Admin cookie'sine bak ('sb-admin-auth')
    const adminCookie = request.cookies.get('sb-admin-auth')
    
    if (!adminCookie && pathname !== '/yonetim/giris') {
      return NextResponse.redirect(new URL('/yonetim/giris', request.url))
    }
    
    // Admin session kontrolü ayrı client ile
    // Normal site session'ına bakma
    return NextResponse.next()
  }

  // Normal site route'ları — admin cookie'ye bakma
  if (pathname.startsWith('/panel')) {
    // Normal site auth cookie'sine bak
    let response = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cs) {
            cs.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          }
        }
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(
        new URL(`/giris?redirect=${encodeURIComponent(pathname)}`, request.url)
      )
    }
  }

  return NextResponse.next({ request })
}
```

### 12.7 Test senaryosu
Bu düzeltme sonrası şu senaryolar çalışmalı:
1. Normal siteden kullanıcı olarak giriş yap → admin paneline git → admin giriş sayfası çıkar (normal kullanıcı admin'e giremez)
2. Admin panelinden giriş yap → normal siteye git → header'da admin kullanıcısı görünmez, site temiz
3. Admin panelinden çıkış yap → normal site oturumu etkilenmez
4. Normal siteden çıkış yap → admin paneli oturumu etkilenmez
5. İki farklı tarayıcı sekmesinde: biri normal site, biri admin paneli — birbirini etkilemez

---

## BÖLÜM 13 — FİLTRELEME SİSTEMİ — TAMAMEN ÇALIŞIR HALE GETİR — TAMAMEN ÇALIŞIR HALE GETİR

### 12.1 /tekneler sayfası filtresi çalışmıyor
Tekneler sayfasında filtre checkbox'larına tıklanınca hiçbir şey olmuyor. Şunları uygula:

```tsx
// app/tekneler/page.tsx — Server Component, URL params ile filtre alır
export default async function TeknelerSayfasi({ searchParams }) {
  const { wifi, havuz, klima, konum, kapasite_min, fiyat_min, fiyat_max, siralama } = searchParams

  let query = supabase
    .from('ilanlar')
    .select('*, ilan_medyalari(url, sira)')
    .eq('aktif', true)
    .eq('tip', 'tekne')

  // Özellik filtreleri
  if (wifi === 'true') query = query.contains('ozellikler', { wifi: true })
  if (havuz === 'true') query = query.contains('ozellikler', { havuz: true })
  if (klima === 'true') query = query.contains('ozellikler', { klima: true })

  // Fiyat filtresi
  if (fiyat_min) query = query.gte('gunluk_fiyat', Number(fiyat_min))
  if (fiyat_max) query = query.lte('gunluk_fiyat', Number(fiyat_max))

  // Kapasite filtresi
  if (kapasite_min) query = query.gte('kapasite', Number(kapasite_min))

  // Konum filtresi
  if (konum) query = query.eq('konum', konum)

  // Sıralama
  if (siralama === 'fiyat_artan') query = query.order('gunluk_fiyat', { ascending: true })
  else if (siralama === 'fiyat_azalan') query = query.order('gunluk_fiyat', { ascending: false })
  else if (siralama === 'en_yeni') query = query.order('olusturulma_tarihi', { ascending: false })
  else query = query.order('sponsorlu', { ascending: false }) // Önerilen: sponsorlu önce

  const { data: tekneler } = await query
  // ...
}
```

Filtre sidebar'ı Client Component olarak yaz:
```tsx
// components/TekneFiltreSidebar.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function TekneFiltreSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filtrele = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('sayfa') // Filtre değişince 1. sayfaya dön
    router.push(`/tekneler?${params.toString()}`)
  }, [router, searchParams])

  const temizle = () => router.push('/tekneler')

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Filtreler</h3>
          <button onClick={temizle} className="text-xs text-sky-600 hover:underline">
            Temizle
          </button>
        </div>

        {/* Fiyat aralığı */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 block mb-2">
            Gecelik Fiyat (₺)
          </label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min"
              defaultValue={searchParams.get('fiyat_min') ?? ''}
              onBlur={e => filtrele('fiyat_min', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <input type="number" placeholder="Max"
              defaultValue={searchParams.get('fiyat_max') ?? ''}
              onBlur={e => filtrele('fiyat_max', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Kapasite */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Kapasite</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '1-4 Kişi', val: '1' },
              { label: '5-8 Kişi', val: '5' },
              { label: '9-12 Kişi', val: '9' },
              { label: '12+ Kişi', val: '13' },
            ].map(({ label, val }) => (
              <button key={val}
                onClick={() => filtrele('kapasite_min', searchParams.get('kapasite_min') === val ? null : val)}
                className={`text-xs py-2 px-3 rounded-xl border transition-all ${
                  searchParams.get('kapasite_min') === val
                    ? 'border-sky-500 bg-sky-50 text-sky-600 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Özellikler */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Özellikler</label>
          <div className="space-y-2">
            {[
              { key: 'wifi', label: '📶 WiFi' },
              { key: 'klima', label: '❄️ Klima' },
              { key: 'generator', label: '⚡ Jeneratör' },
              { key: 'kabin', label: '🛏️ Kamaralar' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={searchParams.get(key) === 'true'}
                  onChange={e => filtrele(key, e.target.checked ? 'true' : null)}
                  className="rounded text-sky-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sıralama */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Sıralama</label>
          <select
            value={searchParams.get('siralama') ?? 'onerilen'}
            onChange={e => filtrele('siralama', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
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

### 12.2 /konaklama sayfası filtresi çalışmıyor
Aynı mantığı villa sayfasına da uygula:

```tsx
// app/konaklama/page.tsx — aynı filtre mantığı, tip='villa'
// Ek olarak villa'ya özel filtreler:
if (yatak_odasi) query = query.gte('yatak_odasi', Number(yatak_odasi))

// VillaFiltreSidebar — TekneFiltreSidebar ile aynı yapı
// Tekneye özel olanlar çıkar (kabin vs), villaya özel ekle (yatak odası, bahçe, jakuzi vb.)
```

Villa filtreleri:
```tsx
{[
  { key: 'havuz', label: '🏊 Havuz' },
  { key: 'wifi', label: '📶 WiFi' },
  { key: 'klima', label: '❄️ Klima' },
  { key: 'deniz_manzarasi', label: '🌊 Deniz Manzarası' },
  { key: 'bahce', label: '🌿 Bahçe' },
  { key: 'bbq', label: '🔥 BBQ / Mangal' },
  { key: 'jakuzi', label: '🛁 Jakuzi' },
  { key: 'evcil_hayvan', label: '🐾 Evcil Hayvan' },
].map(({ key, label }) => (
  <label key={key} className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox"
      checked={searchParams.get(key) === 'true'}
      onChange={e => filtrele(key, e.target.checked ? 'true' : null)}
      className="rounded text-sky-500" />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
))}
```

### 12.3 Aktif filtre pill'leri — listenin üstünde göster
```tsx
// Seçili filtreler görsel olarak gösterilsin
const aktifFiltreler = [
  searchParams.get('havuz') === 'true' && { key: 'havuz', label: '🏊 Havuz' },
  searchParams.get('wifi') === 'true' && { key: 'wifi', label: '📶 WiFi' },
  searchParams.get('fiyat_max') && { key: 'fiyat_max', label: `Max ₺${searchParams.get('fiyat_max')}` },
  // ...
].filter(Boolean)

{aktifFiltreler.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-4">
    {aktifFiltreler.map(filtre => (
      <span key={filtre.key}
        className="inline-flex items-center gap-1 bg-sky-100 text-sky-700
          rounded-full px-3 py-1 text-sm font-medium">
        {filtre.label}
        <button onClick={() => filtrele(filtre.key, null)} className="hover:text-sky-900">
          <X size={12} />
        </button>
      </span>
    ))}
    <button onClick={temizle} className="text-xs text-gray-500 hover:text-gray-700 ml-2">
      Tümünü Temizle
    </button>
  </div>
)}
```

### 12.4 Filtre sonuç sayısı göster
```tsx
<div className="flex items-center justify-between mb-4">
  <p className="text-gray-500 text-sm">
    <span className="font-semibold text-gray-900">{ilanlar.length}</span> sonuç bulundu
    {aktifFiltreSayisi > 0 && ` (${aktifFiltreSayisi} filtre aktif)`}
  </p>
  {/* sıralama dropdown */}
</div>
```

---

## BÖLÜM 14 — ADMİN PANELİ — PROFESYONEL & TAM İŞLEVSEL

### 13.1 Admin panelinde her şey düzenlenebilir olmalı

#### /yonetim/ilanlar — İlan yönetimi
```tsx
// Her ilan için tam işlem seti:
// 1. Onayla (aktif=true yap)
// 2. Reddet (red nedeni modal ile)
// 3. Düzenle (tüm alanlar inline veya modal ile)
// 4. Takvimi Yönet (/yonetim/ilanlar/[id]/takvim)
// 5. Fiyatları Yönet (sezon fiyatları inline düzenleme)
// 6. Sponsorlu Yap / Sponsorluğu Kaldır (sponsorlu toggle)
// 7. Pasife Al / Aktif Et (aktif toggle)
// 8. Sil (onay dialogu ile)

// İlan düzenleme — modal içinde tam form:
<Dialog>
  <DialogContent className="admin-card max-w-2xl">
    <h2 className="text-white font-bold text-lg mb-4">İlan Düzenle</h2>
    <form>
      <input className="admin-input mb-3" placeholder="Başlık" defaultValue={ilan.baslik} />
      <textarea className="admin-input mb-3" placeholder="Açıklama" defaultValue={ilan.aciklama} />
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input className="admin-input" type="number" placeholder="Gecelik Fiyat" defaultValue={ilan.gunluk_fiyat} />
        <input className="admin-input" type="number" placeholder="Temizlik" defaultValue={ilan.temizlik_ucreti} />
        <input className="admin-input" type="number" placeholder="Kapasite" defaultValue={ilan.kapasite} />
      </div>
      <button type="submit" className="admin-btn-primary w-full">Kaydet</button>
    </form>
  </DialogContent>
</Dialog>
```

#### /yonetim/ilanlar/[id]/takvim — Takvim yönetimi (çalışır hale getir)

**Sorun:** Takvimde tarih seçip kaydetme çalışmıyor.

```tsx
// app/yonetim/ilanlar/[id]/takvim/page.tsx
'use client'
import { DayPicker, DateRange } from 'react-day-picker'
import { tr } from 'date-fns/locale'
import { format, eachDayOfInterval } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

export default function AdminTakvim({ params }: { params: { id: string } }) {
  const [range, setRange] = useState<DateRange>()
  const [islem, setIslem] = useState<'dolu' | 'musait'>('dolu')
  const [doluGunler, setDoluGunler] = useState<Date[]>([])
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Mevcut dolu günleri çek
    supabase
      .from('musaitlik')
      .select('tarih')
      .eq('ilan_id', params.id)
      .eq('durum', 'dolu')
      .then(({ data }) => {
        if (data) setDoluGunler(data.map(d => new Date(d.tarih)))
      })
  }, [params.id])

  const handleKaydet = async () => {
    if (!range?.from) return
    setKaydediliyor(true)

    const gunler = eachDayOfInterval({
      start: range.from,
      end: range.to ?? range.from
    })

    const tarihler = gunler.map(g => format(g, 'yyyy-MM-dd'))

    if (islem === 'dolu') {
      const rows = tarihler.map(tarih => ({
        ilan_id: params.id,
        tarih,
        durum: 'dolu'
      }))
      await supabase
        .from('musaitlik')
        .upsert(rows, { onConflict: 'ilan_id,tarih' })
    } else {
      await supabase
        .from('musaitlik')
        .delete()
        .eq('ilan_id', params.id)
        .in('tarih', tarihler)
    }

    // Güncel veriyi yeniden çek
    const { data } = await supabase
      .from('musaitlik')
      .select('tarih')
      .eq('ilan_id', params.id)
      .eq('durum', 'dolu')

    if (data) setDoluGunler(data.map(d => new Date(d.tarih)))
    setRange(undefined)
    setKaydediliyor(false)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Takvim */}
      <div className="lg:col-span-2 admin-card p-6">
        <h3 className="text-white font-bold mb-4">Takvim</h3>
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          locale={tr}
          numberOfMonths={2}
          disabled={{ before: new Date() }}
          modifiers={{ dolu: doluGunler }}
          modifiersStyles={{
            dolu: {
              backgroundColor: 'rgba(239,68,68,0.3)',
              color: '#FCA5A5',
              textDecoration: 'line-through'
            }
          }}
          styles={{
            root: { color: '#e2e8f0' },
            caption: { color: '#e2e8f0' },
            head_cell: { color: '#64748b' },
            nav_button: { color: '#e2e8f0' },
          }}
        />
      </div>

      {/* İşlem paneli */}
      <div className="admin-card p-6">
        <h3 className="text-white font-bold mb-4">İşlem</h3>

        {/* İşlem seçimi */}
        <div className="space-y-3 mb-6">
          <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
            ${islem === 'dolu' ? 'bg-red-500/20 border border-red-500/40' : 'border border-white/10 hover:border-white/20'}`}>
            <input type="radio" checked={islem === 'dolu'} onChange={() => setIslem('dolu')} className="accent-red-500" />
            <div>
              <div className="text-white text-sm font-medium">🔴 Dolu İşaretle</div>
              <div className="text-gray-400 text-xs">Seçilen günleri rezervasyona kapat</div>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
            ${islem === 'musait' ? 'bg-green-500/20 border border-green-500/40' : 'border border-white/10 hover:border-white/20'}`}>
            <input type="radio" checked={islem === 'musait'} onChange={() => setIslem('musait')} className="accent-green-500" />
            <div>
              <div className="text-white text-sm font-medium">🟢 Müsait Yap</div>
              <div className="text-gray-400 text-xs">Dolu işaretini kaldır</div>
            </div>
          </label>
        </div>

        {/* Seçili tarihler */}
        {range?.from && (
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <div className="text-gray-400 text-xs mb-1">Seçilen Aralık:</div>
            <div className="text-white text-sm font-medium">
              {format(range.from, 'd MMM yyyy', { locale: tr })}
              {range.to && ` — ${format(range.to, 'd MMM yyyy', { locale: tr })}`}
            </div>
            {range.to && (
              <div className="text-gray-400 text-xs mt-1">
                {eachDayOfInterval({ start: range.from, end: range.to }).length} gün seçildi
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleKaydet}
          disabled={!range?.from || kaydediliyor}
          className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: islem === 'dolu'
              ? 'linear-gradient(135deg, #EF4444, #DC2626)'
              : 'linear-gradient(135deg, #22C55E, #16A34A)'
          }}>
          {kaydediliyor ? 'Kaydediliyor...' : islem === 'dolu' ? '🔴 Dolu İşaretle' : '🟢 Müsait Yap'}
        </button>

        {/* Renk açıklaması */}
        <div className="mt-6 border-t border-white/10 pt-4 space-y-2">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Renk Kodu</div>
          {[
            { renk: 'bg-red-500/30', label: 'Dolu / Kapalı' },
            { renk: 'bg-sky-500/30', label: 'Onaylı Rezervasyon' },
            { renk: 'bg-amber-500/30', label: 'Özel Fiyat' },
          ].map(({ renk, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${renk} border border-white/20`} />
              <span className="text-gray-400 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### /yonetim/paketler — Paket oluşturma & düzenleme
```tsx
// Paket oluşturma formu — tam işlevsel:
// 1. Başlık, açıklama, kategori
// 2. Süre (gün), kapasite, fiyat
// 3. İlan seçici: aktif ilanları listele, checkbox ile seç
// 4. Kapak görseli upload
// 5. Aktif/Pasif toggle
// 6. Kaydet → paketler tablosuna yaz

// Mevcut paketler tablosu:
// Her satır için: Düzenle, Aktif/Pasif toggle, Sil

const PaketForm = ({ paket }: { paket?: Paket }) => {
  const [seciliIlanlar, setSeciliIlanlar] = useState<string[]>(paket?.ilan_idleri ?? [])

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="admin-label">Paket Adı</label>
          <input className="admin-input" defaultValue={paket?.baslik} />
        </div>
        <div>
          <label className="admin-label">Kategori</label>
          <select className="admin-input" defaultValue={paket?.kategori}>
            <option value="macera">Macera</option>
            <option value="luks">Lüks</option>
            <option value="romantik">Romantik</option>
            <option value="aile">Aile</option>
          </select>
        </div>
        <div>
          <label className="admin-label">Fiyat (₺)</label>
          <input className="admin-input" type="number" defaultValue={paket?.fiyat} />
        </div>
        <div>
          <label className="admin-label">Süre (Gün)</label>
          <input className="admin-input" type="number" defaultValue={paket?.sure_gun} />
        </div>
        <div>
          <label className="admin-label">Kapasite</label>
          <input className="admin-input" type="number" defaultValue={paket?.kapasite} />
        </div>
      </div>

      <div>
        <label className="admin-label">Açıklama</label>
        <textarea className="admin-input" rows={3} defaultValue={paket?.aciklama} />
      </div>

      {/* İlan seçici */}
      <div>
        <label className="admin-label">Pakete Dahil İlanlar</label>
        <div className="bg-white/5 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
          {aktifIlanlar.map(ilan => (
            <label key={ilan.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg">
              <input
                type="checkbox"
                checked={seciliIlanlar.includes(ilan.id)}
                onChange={e => {
                  if (e.target.checked) setSeciliIlanlar(prev => [...prev, ilan.id])
                  else setSeciliIlanlar(prev => prev.filter(id => id !== ilan.id))
                }}
                className="rounded accent-sky-500"
              />
              <span className="text-white/80 text-sm">{ilan.baslik}</span>
              <span className="text-gray-500 text-xs ml-auto">{ilan.tip === 'villa' ? '🏠' : '⛵'} {ilan.konum}</span>
            </label>
          ))}
        </div>
        {seciliIlanlar.length > 0 && (
          <p className="text-sky-400 text-xs mt-1">{seciliIlanlar.length} ilan seçildi</p>
        )}
      </div>

      <button type="submit" className="admin-btn-primary w-full py-3">
        {paket ? 'Güncelle' : 'Paketi Oluştur'}
      </button>
    </form>
  )
}
```

#### /yonetim/ayarlar — Platform ayarları (tüm alanlar kaydedilmeli)
```tsx
// Tüm ayarlar ayarlar tablosundan okunur ve yazılır
// TURSAB no, WhatsApp, komisyon, iletişim bilgileri

const handleKaydet = async (formData: FormData) => {
  const ayarlar = {
    tursab_no: formData.get('tursab_no'),
    whatsapp_number: formData.get('whatsapp_number'),
    komisyon_orani: Number(formData.get('komisyon_orani')) / 100,
    iletisim_email: formData.get('iletisim_email'),
    iletisim_telefon: formData.get('iletisim_telefon'),
    site_slogan: formData.get('site_slogan'),
  }

  // Önce var mı kontrol et
  const { data: mevcut } = await supabase.from('ayarlar').select('id').limit(1).single()

  if (mevcut) {
    await supabase.from('ayarlar').update(ayarlar).eq('id', mevcut.id)
  } else {
    await supabase.from('ayarlar').insert(ayarlar)
  }

  // lib/constants.ts değerlerini de güncelle (runtime)
  // NOT: Sonraki sayfa yüklemelerinde yeni değerler gelir
}
```

#### /yonetim/kullanicilar — Kullanıcı yönetimi
```tsx
// Admin client ile (RLS bypass):
const { data: kullanicilar } = await adminSupabase
  .from('kullanicilar')
  .select('*')
  .order('olusturulma_tarihi', { ascending: false })

// Rol değiştirme — inline dropdown:
const rolDegistir = async (kullaniciId: string, yeniRol: string) => {
  await adminSupabase
    .from('kullanicilar')
    .update({ rol: yeniRol })
    .eq('id', kullaniciId)
}

// Kullanıcı silme (Supabase Auth'tan da sil):
const kullaniciSil = async (kullaniciId: string) => {
  await adminSupabase.auth.admin.deleteUser(kullaniciId)
  await adminSupabase.from('kullanicilar').delete().eq('id', kullaniciId)
}
```

#### /yonetim/rezervasyonlar — Rezervasyon yönetimi
```tsx
// Durum değiştirme — onaylama rezervasyonu takvime de yansıtsın:
const rezervasyonOnayla = async (rezervasyonId: string) => {
  // 1. Rezervasyon durumunu güncelle
  const { data: rez } = await adminSupabase
    .from('rezervasyonlar')
    .update({ durum: 'onaylandi' })
    .eq('id', rezervasyonId)
    .select('ilan_id, giris_tarihi, cikis_tarihi')
    .single()

  if (rez) {
    // 2. Takvimi otomatik doldur
    const { eachDayOfInterval, format } = await import('date-fns')
    const gunler = eachDayOfInterval({
      start: new Date(rez.giris_tarihi),
      end: new Date(rez.cikis_tarihi)
    })
    const rows = gunler.map(g => ({
      ilan_id: rez.ilan_id,
      tarih: format(g, 'yyyy-MM-dd'),
      durum: 'dolu'
    }))
    await adminSupabase.from('musaitlik').upsert(rows, { onConflict: 'ilan_id,tarih' })
  }
}

const rezervasyonIptal = async (rezervasyonId: string) => {
  const { data: rez } = await adminSupabase
    .from('rezervasyonlar')
    .update({ durum: 'iptal' })
    .eq('id', rezervasyonId)
    .select('ilan_id, giris_tarihi, cikis_tarihi')
    .single()

  if (rez) {
    // Takvimden sil
    const { eachDayOfInterval, format } = await import('date-fns')
    const gunler = eachDayOfInterval({
      start: new Date(rez.giris_tarihi),
      end: new Date(rez.cikis_tarihi)
    })
    await adminSupabase
      .from('musaitlik')
      .delete()
      .eq('ilan_id', rez.ilan_id)
      .in('tarih', gunler.map(g => format(g, 'yyyy-MM-dd')))
  }
}
```

### 13.2 Admin panel genel UX iyileştirmeleri

**Toast bildirimleri:** Her işlem sonrası başarı/hata toast'u göster:
```tsx
// İşlem başarılı
toast.success('İlan onaylandı')
// İşlem başarısız
toast.error('Bir hata oluştu: ' + error.message)
```

**Yükleme durumları:** Her buton loading state'e girsin:
```tsx
const [yukleniyor, setYukleniyor] = useState<string | null>(null)
// buton: disabled={yukleniyor === ilan.id}
```

**Onay dialogları:** Silme ve iptal işlemleri için onay iste:
```tsx
if (!confirm(`"${ilan.baslik}" ilanını silmek istediğinizden emin misiniz?`)) return
```

**Sayfa başlıkları:** Her admin sayfasının başında breadcrumb ve sayfa başlığı olsun:
```tsx
<div className="mb-6">
  <div className="text-gray-500 text-sm mb-1">Yönetim / İlanlar</div>
  <h1 className="text-white text-2xl font-bold">İlan Yönetimi</h1>
  <p className="text-gray-400 text-sm mt-1">Tüm ilanları görüntüle, onayla ve düzenle</p>
</div>
```

**Boş durum:** Veri yoksa güzel boş durum göster:
```tsx
{ilanlar.length === 0 && (
  <div className="text-center py-16">
    <div className="text-5xl mb-4">📭</div>
    <div className="text-white font-medium">Henüz ilan yok</div>
    <div className="text-gray-400 text-sm mt-1">İlanlar buraya gelecek</div>
  </div>
)}
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test et:
1. Hero video boyutu uygun mu? (75vh, taşmıyor)
2. Mobilde video görünüyor mu?
3. Ana sayfada Türkçe karakterler düzeldi mi?
4. Giriş sayfası iki kolonlu mu?
5. Kayıt sayfasında rol seçimi var mı?
6. Hakkımızda sayfası doldu mu?
7. İlan detay takviminde fiyatlar doğru mu?
8. /konaklama filtresi çalışıyor mu? (checkbox seçince URL değişiyor mu?)
9. /tekneler filtresi çalışıyor mu?
10. Admin takvimde tarih seçip kaydet çalışıyor mu?
11. Admin ilan düzenleme modal çalışıyor mu?
12. Admin rezervasyon onaylayınca takvim doluyor mu?
13. /iletisim sayfası açılıyor mu?
