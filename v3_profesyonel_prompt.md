# SezondalKirala — V3 Profesyonel Tasarım & Bug Fix Promptu

Aşağıdaki tüm maddeleri sırayla uygula. Her bölüm sonrası `npm run build` al. Hedef: kullanıcı siteye girdiğinde "vay be" desin, güven hissetsin, hemen rezervasyon yapmak istesin.

---

## BÖLÜM 0 — ÖNCE BUGLAR (Build'i kıran şeyler)

### 0.1 Admin paneli kullanıcı listesi boş
**Sorun:** `/yonetim/kullanicilar` sayfası boş geliyor, Supabase'de kullanıcılar var.
**Çözüm:**
- Sorgu `kullanicilar` tablosuna `createAdminClient()` ile yapılıyor mu kontrol et (RLS bypass gerekir)
- `createClient()` (anon key) ile yapılıyorsa `createAdminClient()` (service role) ile değiştir
- Supabase Auth kullanıcıları ile `kullanicilar` tablosunu join etmiyorsa:
  ```ts
  const { data } = await adminClient.from('kullanicilar').select('*').order('olusturulma_tarihi', { ascending: false })
  ```
- Hata varsa console'a yazdır ve sayfada göster

### 0.2 Rezervasyon kullanıcıya görünmüyor
**Sorun:** Kullanıcı rezervasyon yaptı ama `/panel/rezervasyonlar` boş.
**Çözüm:**
- `/panel/rezervasyonlar` sorgusu: `WHERE kullanici_id = auth.uid()` doğru mu?
- RLS policy: `rezervasyonlar` tablosunda kullanıcı kendi kayıtlarını görebiliyor mu?
- Eğer RLS kapalıysa şu policy'yi Supabase'de çalıştır:
  ```sql
  CREATE POLICY "Kullanici kendi rezervasyonlarini gorur" ON rezervasyonlar
  FOR SELECT USING (auth.uid() = kullanici_id);
  ```
- Sayfa sunucu tarafında mı istemci tarafında mı çekiyor? Server Component ise `createClient()` (server) kullan

### 0.3 Paket kartlarına tıklanmıyor
**Sorun:** Ana sayfadaki paket kartları tıklanamıyor veya yönlendirmiyor.
**Çözüm:**
- Her pakete `/paketler/${paket.id}` veya `/paketler?id=${paket.id}` linki ekle
- Kart tamamen `<Link href="...">` içine sar
- `pointer-events: none` gibi CSS sorunu var mı kontrol et
- `/paketler/[id]` sayfası yoksa oluştur: paket detayı, dahil olan ilanlar, rezervasyon yap butonu

### 0.4 Ana sayfada fotoğraflar görünmüyor
**Sorun:** İlan kartları ana sayfada fotoğrafsız geliyor, `/konaklama`'da görünüyor.
**Çözüm:**
- Ana sayfa sorgusuna `ilan_medyalari` join ekle:
  ```ts
  .select('*, ilan_medyalari(url, sira)')
  .eq('aktif', true)
  .order('sira', { foreignTable: 'ilan_medyalari' })
  ```
- İlk medyayı (sira=1 veya index 0) kapak olarak kullan
- Medya yoksa `/images/villa-placeholder.jpg` göster (public klasörüne ekle)

---

## BÖLÜM 1 — TASARIM SİSTEMİ — KÖKTEN DEĞİŞTİR

### 1.1 Renk paleti ve genel stil
Mevcut düz beyaz tasarımı kaldır. Yeni sistem:

```css
/* globals.css veya tailwind.config.ts */
--color-primary: #0EA5E9;      /* Gökyüzü mavisi */
--color-primary-dark: #0284C7;
--color-secondary: #22C55E;    /* Doğa yeşili */
--color-secondary-dark: #16A34A;
--color-accent: #F59E0B;       /* Altın sarısı — fiyatlar, rozetler */
--color-dark: #0F172A;         /* Footer, koyu bölümler */
--color-surface: #F8FAFC;      /* Sayfa arka planı — saf beyaz değil */
--color-card: #FFFFFF;
--color-text: #1E293B;
--color-text-muted: #64748B;
```

**Genel prensipler:**
- Sayfa arka planı `#F8FAFC` (hafif gri-mavi ton) — saf beyaz değil
- Bölümler arasında dönüşümlü: beyaz bölüm → hafif yeşil/mavi tintli bölüm → beyaz
- Kartlar beyaz, `box-shadow: 0 2px 20px rgba(0,0,0,0.08)`, `border-radius: 16px`
- Tüm butonlar `border-radius: 12px`, padding dolgun
- Başlıklar koyu `#0F172A`, body text `#374151`

### 1.2 Tipografi
```css
/* Font: Inter (Google Fonts'tan yükle) */
font-family: 'Inter', -apple-system, sans-serif;

h1: 48px / 56px, font-weight: 700, letter-spacing: -0.02em
h2: 36px / 44px, font-weight: 700
h3: 24px / 32px, font-weight: 600
h4: 18px / 28px, font-weight: 600
body: 16px / 24px, font-weight: 400
small: 14px / 20px
```

---

## BÖLÜM 2 — ANA SAYFA — BAŞTAN SONA YENİDEN YAZ

### 2.1 Hero Section — Büyüleyici olmalı
```
Yapı:
- 100vh yükseklik
- Arka plan: yüksek kaliteli Fethiye/Ölüdeniz görseli (unsplash'tan iyi bir fotoğraf seç)
- Üzerine gradient: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)
- İçerik ortada, dikey ortalanmış
```

**Hero içeriği:**
```
[Küçük rozet: ✈️ Fethiye'nin #1 Villa Platformu]

Hayalinizdeki Tatil
Fethiye'de Başlar

Villa ve tekne seçenekleriyle kendinizi şımartın.
500+ mutlu misafir, TURSAB güvencesiyle.

[Arama Formu — beyaz, yuvarlak köşeli kart]
[📅 Giriş]  [📅 Çıkış]  [👥 Kişi]  [🔍 Villa Ara]

Alt istatistikler (beyaz, yarı şeffaf):
[🏠 50+ Villa] [⛵ 20+ Tekne] [⭐ 4.9/5] [✅ TURSAB]
```

**Animasyonlar (Framer Motion):**
- Rozet: fadeIn 0.3s
- Başlık: slideUp 0.5s
- Alt başlık: slideUp 0.7s
- Form: slideUp 0.9s
- İstatistikler: fadeIn 1.1s

### 2.2 Güven Bandı (Hero altında)
Tam genişlik, beyaz arka plan, hafif gölge:
```
[🔒 SSL Güvenli Ödeme]  [✅ Admin Onaylı İlanlar]  [📞 7/24 WhatsApp Destek]  [🏆 TURSAB Belgeli]  [⚡ Anında Rezervasyon]
```
Yatay scroll (mobilde), ikonlar mavi, metinler koyu.

### 2.3 Tatil Kategorileri Section
```
Başlık: "Ne Tür Tatil İstiyorsunuz?"
Alt başlık: "İhtiyacınıza özel seçenekler"

4 büyük kart (2x2 grid):
┌─────────────────┐  ┌─────────────────┐
│  🏔️ Macera      │  │  👑 Lüks        │
│  Fotoğraf bg    │  │  Fotoğraf bg    │
│  "Doğayla İç    │  │  "Konforun      │
│   İçe Tatil"    │  │   Zirvesi"      │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│  💑 Romantik    │  │  👨‍👩‍👧‍👦 Aile       │
│  Fotoğraf bg    │  │  Fotoğraf bg    │
│  "Unutulmaz     │  │  "Herkes İçin   │
│   Kaçamak"      │  │   Eğlence"      │
└─────────────────┘  └─────────────────┘

Her karta tıklanınca: /konaklama?kategori=macera
Hover: overlay koyulaşır, "İncele →" butonu ortaya çıkar
```

### 2.4 Öne Çıkan Paketler
```
Section arka planı: hafif yeşil tint (#F0FDF4)
Başlık: "Hazır Tatil Paketleri"
Alt: "Konaklama + aktivite bir arada"

Kategori tabları (pill butonlar): Tümü | Macera | Lüks | Romantik | Aile
Aktif tab: yeşil arka plan, beyaz yazı

Paket kartları (horizontal scroll veya 3 kolon grid):
┌────────────────────────────────┐
│  [Fotoğraf — tam genişlik]     │
│  [Kategori badge — yeşil]      │
├────────────────────────────────┤
│  Fethiye Macera Paketi         │
│  ⏱ 5 Gün  👥 Max 8 Kişi      │
│  ─────────────────────────     │
│  ✓ Villa konaklama             │
│  ✓ Tekne turu                  │
│  ✓ Transfer dahil              │
│  ─────────────────────────     │
│  Kişi başı ₺2.060              │
│  Toplam: ₺10.300               │
│  [Paketi İncele →]             │
└────────────────────────────────┘
```

### 2.5 Öne Çıkan Villalar
```
Section arka planı: beyaz
Başlık: "Seçkin Villalarımız"
Alt: "Fethiye'nin en güzel köşelerinde"

Sağ üste: [Tümünü Gör →]

Grid: 3 kolon (masaüstü), 2 (tablet), 1 (mobil)
```

**Kart tasarımı (Airbnb kalitesinde):**
```
┌──────────────────────────────────┐
│  [Fotoğraf — aspect 4/3]         │  ← hover'da zoom
│  [❤️ favori]   [⭐ Öne Çıkan]   │  ← üst köşeler
├──────────────────────────────────┤
│  📍 Ölüdeniz, Fethiye            │  ← muted, küçük
│  Ölüdeniz Manzaralı Lüks Villa   │  ← bold
│  🛏️ 4  🚿 3  👥 8 kişi          │  ← ikonlu
│  ⭐ 4.9 (24 yorum)               │  ← sarı yıldız
│  ─────────────────────────────   │
│  ₺4.500 / gece                   │  ← büyük, mavi
│  [Detayı Gör]                    │  ← tam genişlik buton
└──────────────────────────────────┘
```

### 2.6 Nasıl Çalışır?
```
Section: hafif mavi tint (#EFF6FF)
Başlık: "3 Adımda Tatil Rezervasyonu"

Yatay 3 adım (masaüstü), dikey (mobil):

[1]──────────────[2]──────────────[3]
 🔍 Ara & Seç    📅 Rezervasyon    🏖️ Tatil
                  Yap              Keyfi
"Tarih ve         "Online güvenli  "Biz hallederiz,
 kişi sayısı       ödeme, anında    siz eğlenin"
 gir, filtrele"    onay"

Aralarında animasyonlu ok (→)
```

### 2.7 Müşteri Yorumları
```
Section: beyaz
Başlık: "Misafirlerimiz Ne Diyor?"

3 yorum kartı (yorumlar tablosundan en yüksek puanlılar):
┌──────────────────────────────────┐
│  ⭐⭐⭐⭐⭐                        │
│  "Muhteşem bir tatildi, villa    │
│   tam beklediğimiz gibiydi..."   │
│  ─────────────────────────────   │
│  [👤] Ayşe K.                    │
│  Ölüdeniz Manzaralı Lüks Villa  │
│  Temmuz 2025                     │
└──────────────────────────────────┘

Tırnak işareti büyük ve dekoratif (")
Avatar daire, baş harf göster
```

### 2.8 Fethiye Bölgeleri
```
Section: koyu (#0F172A), beyaz yazılar
Başlık: "Fethiye'yi Keşfedin"

Yatay scroll kart listesi:
[Ölüdeniz] [Çalış] [Göcek] [Hisarönü] [Kayaköy] [Fethiye Merkez]

Her bölge kartı: fotoğraf bg, bölge adı, "X Villa" sayısı
Tıklanınca: /konaklama?konum=oludeniz
```

### 2.9 CTA Section
```
Gradient arka plan: mavi→yeşil (#0EA5E9 → #22C55E)
Beyaz yazılar:

"Hayalinizdeki Tatili Bulmaya Hazır mısınız?"
"Fethiye'nin en seçkin villaları sizi bekliyor."

[Hemen Rezervasyon Yap]  [WhatsApp ile Bilgi Al]
```

---

## BÖLÜM 3 — FOTOĞRAF GALERİSİ — İLAN DETAY SAYFASI

### 3.1 Ana galeri yapısı
```
Masaüstü layout:
┌─────────────────────┬──────────┬──────────┐
│                     │  Foto 2  │  Foto 3  │
│      Ana Foto       ├──────────┼──────────┤
│   (60% genişlik)    │  Foto 4  │  Foto 5  │
│                     │          │+X fotoğraf│
└─────────────────────┴──────────┴──────────┘

"Tüm fotoğrafları gör" butonu → lightbox
```

### 3.2 Lightbox (fullscreen galeri)
- Tüm fotoğraflar tam ekran
- **SOL ve SAĞ ok butonları** (büyük, yarı şeffaf beyaz daire)
- Alt thumbnail şeridi (küçük önizlemeler, aktif olan border)
- Klavye: ← → ok tuşları, ESC kapatır
- Mobil: swipe/kaydırma ile geçiş
- Fotoğraf sayacı: "3 / 12"
- Kapatma (X) butonu sağ üst
- Kütüphane: `yet-another-react-lightbox` veya `react-image-gallery` kullan

### 3.3 Mobil galeri
- Tek fotoğraf göster, yatay swipe ile diğerlerine geç
- Alt nokta göstergesi (● ○ ○ ○)
- Sol/sağ ok butonları küçük ama görünür

---

## BÖLÜM 4 — ÖDEME SAYFASI — GÜVEN VER

### 4.1 Ödeme adımı tamamen yeniden yaz
Şu anki dandik görünümü at, profesyonel yap:

```
Sayfa başlığı: "Güvenli Ödeme"
Alt: "256-bit SSL şifreleme ile korunan güvenli ödeme sayfası"

SOL TARAF (2/3):
┌─────────────────────────────────────┐
│  Ödeme Yöntemi Seçin               │
│  ──────────────────────────────     │
│  ○ 💳 Kredi / Banka Kartı          │
│  ○ 🏦 Havale / EFT                 │
│  ○ 📱 QR Kod ile Ödeme             │
└─────────────────────────────────────┘

[Kredi Kartı seçiliyse]:
┌─────────────────────────────────────┐
│  Kart Üzerindeki Ad                │
│  [                              ]   │
│                                     │
│  Kart Numarası                      │
│  [💳                         ] 🔒  │
│                                     │
│  Son Kullanma    CVV                 │
│  [  AA/YY    ]  [ ??? ] ❓          │
│                                     │
│  Taksit Seçeneği                    │
│  ○ Peşin  ○ 3 Taksit  ○ 6 Taksit  │
│                                     │
│  [🔒 GÜVENLİ ÖDEME YAP — ₺32.000]  │
└─────────────────────────────────────┘

Kartın üstünde visa/mastercard logoları
"3D Secure korumalı" yazısı

[Havale seçiliyse]:
┌─────────────────────────────────────┐
│  Havale Bilgileri                   │
│  ─────────────────────────────      │
│  Banka: Garanti BBVA               │
│  IBAN: TR00 0000 0000 0000 0000 00 │
│  Hesap Adı: SezondalKirala Ltd.    │
│  Açıklama: SZK-20260715-4823       │
│                                     │
│  ⚠️ Havale sonrası WhatsApp'tan    │
│  dekontunuzu gönderin:             │
│  +90 5XX XXX XX XX                 │
│                                     │
│  [Havale Yaptım, Onay Bekle]       │
└─────────────────────────────────────┘

SAĞ TARAF (1/3 — sticky):
Rezervasyon özeti kartı (aynı şekilde)
+ Güven rozetleri:
  🔒 SSL Güvenli
  ✅ TURSAB Üyesi
  💯 Onaylı Platform
  📞 7/24 Destek
```

### 4.2 Ödeme sonrası onay sayfası
```
┌────────────────────────────────────────┐
│                                        │
│         ✅  (büyük yeşil animasyon)    │
│                                        │
│   Rezervasyonunuz Alındı!             │
│                                        │
│   Referans No: SZK-20260715-4823      │
│   (kopyala ikonu ile)                  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 📋 Rezervasyon Özeti             │  │
│  │ Villa: Ölüdeniz Manzaralı...     │  │
│  │ Giriş: 15 Temmuz 2026           │  │
│  │ Çıkış: 22 Temmuz 2026           │  │
│  │ Misafir: 4 kişi                 │  │
│  │ Toplam: ₺32.000                 │  │
│  └──────────────────────────────────┘  │
│                                        │
│  📧 Onay emaili gönderildi            │
│  admin@sezondalkirala.com              │
│                                        │
│  ┌──────────┐  ┌────────────────────┐  │
│  │Rezervas- │  │   WhatsApp ile     │  │
│  │yonlarım  │  │   İletişim Kur     │  │
│  └──────────┘  └────────────────────┘  │
│                                        │
│  [TURSAB badge — belirgin]             │
└────────────────────────────────────────┘
```

---

## BÖLÜM 5 — HEADER YENİDEN YAZ

### 5.1 Header tasarımı
```
Scroll'da: şeffaf → beyaz (blur backdrop ile)
Yükseklik: 72px
Logo: sol — "SezondalKirala" (mavi)

Navigasyon (orta):
Ana Sayfa | Konaklama | Tekneler | Paketler | Hakkımızda

Sağ:
- Giriş yapılmamışsa: [Giriş Yap] [Kayıt Ol →]
- Giriş yapılmışsa: [🔔] [Avatar dropdown]

Dropdown içeriği role göre (Bölüm 4.3'teki gibi)
```

### 5.2 Mobil header
- Hamburger ikonu sağda
- Tıklanınca: sağdan kayan full-height drawer
- Drawer içinde: logo, nav linkleri (büyük), giriş/kayıt butonları
- Arka plan blur overlay

---

## BÖLÜM 6 — KARTLARDAKİ GÖRSEL SORUNLARI DÜZELt

### 6.1 next/image konfigürasyonu
`next.config.js`'e şunu ekle:
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'https', hostname: '*.unsplash.com' },
  ],
  unoptimized: false,
}
```

### 6.2 Placeholder görseller
`public/images/` klasörüne ekle:
- `villa-placeholder.jpg` — güzel bir villa silueti
- `tekne-placeholder.jpg` — tekne silueti
- `user-avatar.png` — varsayılan avatar

Görsel yoksa:
```tsx
<div className="bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
  <span className="text-4xl">🏠</span>
</div>
```

### 6.3 İlan kart görseli
Her ilan kartı için:
```tsx
const kapakGorsel = ilan.ilan_medyalari?.[0]?.url ?? '/images/villa-placeholder.jpg'
```

---

## BÖLÜM 7 — YEŞİL & DOĞA HISSI KAT

### 7.1 Sayfaya yeşillik/doğa hissi ekle

**Dekoratif elementler (SVG, CSS):**
- Hero arka planında hafif yaprak/dalga SVG pattern (opacity: 0.05)
- Bölüm geçişlerinde dalga şekli (`<svg viewBox="0 0 1440 80">` wave divider)
- "Nasıl Çalışır" bölümü: yeşil tint arka plan
- Footer üstünde yeşil dalga

**Renk kullanımı:**
- Fiyat bilgileri: yeşil (`text-green-600`)
- "Müsait" badge: yeşil arka plan
- "Dolu" badge: kırmızı
- "Öne Çıkan" badge: altın sarısı
- CTA butonlar: yeşil gradient

**Section arka planları sırayla:**
1. Hero: koyu (fotoğraf)
2. Güven bandı: beyaz
3. Kategoriler: beyaz
4. Paketler: `#F0FDF4` (hafif yeşil)
5. Villalar: beyaz
6. Nasıl Çalışır: `#EFF6FF` (hafif mavi)
7. Yorumlar: `#FAFAFA`
8. Bölgeler: `#0F172A` (koyu)
9. CTA: yeşil-mavi gradient
10. Footer: `#0F172A`

### 7.2 Wave divider bileşeni
`components/WaveDivider.tsx` oluştur:
```tsx
export function WaveDivider({ color = '#ffffff', flip = false }) {
  return (
    <div style={{ transform: flip ? 'scaleY(-1)' : undefined }}>
      <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill={color}/>
      </svg>
    </div>
  )
}
```
Bölümler arası geçişlerde kullan.

---

## BÖLÜM 8 — ANİMASYONLAR

`npm install framer-motion` (zaten yoksa)

### 8.1 Kullanılacak animasyonlar
```tsx
// Sayfa geçişi
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

// Kart hover
className="transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"

// Fade in on scroll (Intersection Observer)
// Her section için aşağıdan yukarıya gel

// Sayaç animasyonu (istatistikler)
// 0'dan hedefe 2 saniyede

// Skeleton shimmer
// Veri gelene kadar gri shimmer göster
```

### 8.2 Uygulanacak yerler
- Hero: staggered slideUp (her element 200ms gecikmeli)
- Kart grid: staggered fadeIn (her kart 100ms gecikmeli)
- Sayfa geçişleri: fadeIn/fadeOut
- Butonlar: scale(1.03) hover
- Takvim günleri: smooth color transition
- Yükleme: shimmer skeleton
- Toast bildirimleri: slideIn from right

---

## BÖLÜM 9 — PAKET DETAY SAYFASI (/paketler/[id])

Bu sayfa eksik, oluştur:
```
Hero: paket kapak fotoğrafı + başlık + kategori badge

İki kolon:
Sol (2/3):
- Paket açıklaması
- "Bu Pakete Dahil Olanlar" listesi (✓ ile)
- Dahil olan ilanlar (mini kart listesi — tıklanınca ilan detayına git)
- Program (varsa): 1. gün / 2. gün vb.

Sağ (1/3, sticky):
- Süre: X gün
- Kapasite: X kişiye kadar
- Fiyat: ₺XX.XXX
- [Rezervasyon Yap] butonu
- [WhatsApp ile Bilgi Al] butonu
- TURSAB badge
```

---

## BÖLÜM 10 — MOBİL İYİLEŞTİRMELER

- Tüm touch target min 48px yükseklik
- İlan detayda sticky bottom bar: "₺X.XXX/gece · [Rezervasyon Yap] · [💬]"
- WhatsApp butonu: `fixed bottom-24 right-4 z-50` — büyük yeşil daire, pulse animasyonu
- Filtre sidebar: bottom sheet (alttan kayar, %90 ekran yüksekliği)
- Fotoğraf galeri: swipe ile geçiş, nokta göstergesi
- Header scroll'da küçülür (72px → 56px)
- Arama formu mobilde accordion gibi açılır

---

## BÖLÜM 11 — GENEL POLİSH

- Tüm `console.log` debug satırlarını sil
- TypeScript `any` kullanımlarını düzelt
- Loading state: tüm async operasyonlarda spinner veya skeleton
- Error state: hata mesajları Türkçe ve güzel
- Empty state: "Henüz ilan yok" — illüstrasyon + açıklama + CTA butonu
- 404 sayfası: güzel tasarım, ana sayfaya dön
- Tüm link ve butonların çalıştığını kontrol et
- Form validation mesajları Türkçe
- `aria-label` eksiklerini tamamla (erişilebilirlik)

---

## SONUNDA

```bash
npm run build
npm run lint
```

Her ikisi hatasız geçmeli.

Sonra şu URL'leri test et:
- / → hero, paketler, villalar görünüyor mu?
- /konaklama → filtre çalışıyor mu?
- /konaklama/[id] → galeri, takvim, fiyat hesaplama çalışıyor mu?
- /paketler → kartlar tıklanıyor mu?
- /paketler/[id] → detay sayfası var mı?
- /giris → giriş yapılıyor mu?
- /panel/rezervasyonlar → rezervasyonlar görünüyor mu?
- /yonetim/kullanicilar → kullanıcılar listesi geliyor mu?
- /rezervasyon/[id] → 4 adım çalışıyor mu?

Hepsini test et ve raporla.
