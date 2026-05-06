# SezondalKirala — Video Arka Plan & Kapsamlı Bug Fix Promptu (V5)

---

## VİDEO DOSYASI KONUMU

`video.mp4` dosyasını şu klasöre koy:
```
sezondakirala/
└── public/
    └── videos/
        └── video.mp4   ← BURAYA
```
`public/videos/` klasörü yoksa oluştur. Sonra aşağıdaki değişiklikleri uygula.

---

## BÖLÜM 1 — HERO VİDEO ARKA PLAN

### 1.1 Ana sayfada fotoğrafı videoyla değiştir

`app/page.tsx` (veya Hero bileşeni) içindeki hero section'ı bul. Şu anda `<Image>` ile Unsplash fotoğrafı kullanılıyor. Bunu kaldır, yerine `<video>` etiketi koy:

```tsx
// Hero section içinde, arka plan olarak:
<div className="absolute inset-0 overflow-hidden">
  <video
    autoPlay
    loop
    muted
    playsInline
    className="absolute inset-0 w-full h-full object-cover"
    style={{ zIndex: 0 }}
  >
    <source src="/videos/video.mp4" type="video/mp4" />
    {/* Fallback: video yüklenemezse gradient göster */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-green-900" />
  </video>
  {/* Koyu gradient overlay — video üzerinde okunabilirlik için */}
  <div
    className="absolute inset-0"
    style={{
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)',
      zIndex: 1
    }}
  />
</div>

{/* Hero içeriği — video ve overlay üzerinde */}
<div className="relative" style={{ zIndex: 2 }}>
  {/* başlık, arama formu vb. */}
</div>
```

### 1.2 Video özellikleri
- `autoPlay` — sayfa açılınca otomatik başlar
- `loop` — bitince başa döner, sürekli oynar
- `muted` — ses çıkmaz (autoPlay için zorunlu)
- `playsInline` — mobilde tam ekran açılmaz, inline oynar
- `object-cover` — video tam alanı kaplar, orantı korunur

### 1.3 Performans
Video boyutu büyükse (`next.config.js`'e ekle):
```js
// next.config.js
async headers() {
  return [
    {
      source: '/videos/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ]
},
```

---

## BÖLÜM 2 — TAKVİM Z-INDEX SORUNU (KRİTİK BUG)

### 2.1 Sorun
İlan detay sayfasında (`/konaklama/[id]`) takvim günleri tıklandığında dropdown/popup arka planda kalıyor, tıklanamıyor.

### 2.2 Çözüm
Takvim bileşeninin parent container'larında `overflow: hidden` veya düşük `z-index` var. Şunları düzelt:

```tsx
// Takvim wrapper'ına z-index ekle:
<div className="relative" style={{ zIndex: 50 }}>
  <DayPicker ... />
</div>

// Fiyat kartı (sticky sağ kolon) z-index:
<div className="sticky top-24" style={{ zIndex: 40 }}>
  {/* fiyat kartı içeriği */}
</div>
```

**globals.css'e ekle:**
```css
/* react-day-picker dropdown/popup z-index fix */
.rdp {
  position: relative;
  z-index: 50;
}
.rdp-months {
  position: relative;
  z-index: 50;
}
/* Takvim açık olduğunda overlay üzerinde kalması için */
[data-radix-popper-content-wrapper] {
  z-index: 9999 !important;
}
```

**Eğer takvim bir `Popover` veya `Dialog` içindeyse:**
```tsx
// shadcn/ui Popover kullanılıyorsa:
<PopoverContent className="z-[9999] p-0" align="start">
  <DayPicker ... />
</PopoverContent>
```

**Eğer takvim inline (popup değil) gösteriliyorsa:**
Takvimin üstündeki tüm parent elementlerde `overflow: hidden` var mı kontrol et, varsa kaldır:
```tsx
// YANLIŞ:
<div className="overflow-hidden">  {/* bu takvimi keser */}
  <DayPicker />
</div>

// DOĞRU:
<div className="overflow-visible">
  <DayPicker />
</div>
```

### 2.3 Tarih seçim mantığı düzelt
Takvimde gün seçimi için:
```tsx
'use client'
import { useState } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import { tr } from 'date-fns/locale'

const [range, setRange] = useState<DateRange | undefined>()

<DayPicker
  mode="range"
  selected={range}
  onSelect={setRange}
  locale={tr}
  disabled={[
    { before: new Date() }, // geçmiş tarihler
    ...doluGunler // musaitlik tablosundan gelen dolu günler
  ]}
  modifiers={{
    dolu: doluGunler,
  }}
  modifiersStyles={{
    dolu: { 
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
      textDecoration: 'line-through'
    }
  }}
  styles={{
    day_selected: { backgroundColor: '#0EA5E9', color: 'white' },
    day_range_middle: { backgroundColor: '#DBEAFE' },
  }}
  numberOfMonths={2}  // masaüstünde 2 ay göster
/>
```

---

## BÖLÜM 3 — İLAN DETAY SAYFASI SORUNLARI

### 3.1 Takvim Türkçe olmalı
```tsx
import { tr } from 'date-fns/locale'
// DayPicker'a locale={tr} ekle
// Gün başlıkları: Pzt Sal Çar Per Cum Cmt Paz
// Ay isimleri: Ocak Şubat Mart...
```

### 3.2 Fiyat hesaplama çalışmıyor
```
Şu an: "0 gece x ₺4.500 + Temizlik (₺500) Toplam: ₺0"
Olması gereken: tarih seçilince anlık hesaplama
```
```tsx
const geceSayisi = range?.from && range?.to
  ? Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
  : 0

const toplamFiyat = geceSayisi > 0
  ? geceSayisi * ilan.gunluk_fiyat + ilan.temizlik_ucreti
  : 0

// Gösterim:
{geceSayisi > 0 ? (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span>{geceSayisi} gece × ₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}</span>
      <span>₺{(geceSayisi * ilan.gunluk_fiyat).toLocaleString('tr-TR')}</span>
    </div>
    <div className="flex justify-between text-sm mb-3">
      <span>Temizlik ücreti</span>
      <span>₺{ilan.temizlik_ucreti.toLocaleString('tr-TR')}</span>
    </div>
    <hr/>
    <div className="flex justify-between font-bold mt-3">
      <span>Toplam</span>
      <span>₺{toplamFiyat.toLocaleString('tr-TR')}</span>
    </div>
  </div>
) : (
  <p className="text-gray-500 text-sm">Fiyat görmek için tarih seçin</p>
)}
```

### 3.3 Galeri ok butonları
```
Şu an: küçük görseller sadece altta değişiyor, ana görselde ok butonu yok
Olması gereken: ana görsel üzerinde sol/sağ ok butonları
```
```tsx
const [aktifIndex, setAktifIndex] = useState(0)

// Ana görsel üzerinde:
<div className="relative">
  <Image src={gorseller[aktifIndex]} ... />
  
  {/* Sol ok */}
  <button
    onClick={() => setAktifIndex(i => Math.max(0, i-1))}
    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 
               rounded-full flex items-center justify-center shadow-lg
               hover:bg-white transition-colors z-10"
    disabled={aktifIndex === 0}
  >
    <ChevronLeft size={20} />
  </button>
  
  {/* Sağ ok */}
  <button
    onClick={() => setAktifIndex(i => Math.min(gorseller.length-1, i+1))}
    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 
               rounded-full flex items-center justify-center shadow-lg
               hover:bg-white transition-colors z-10"
    disabled={aktifIndex === gorseller.length-1}
  >
    <ChevronRight size={20} />
  </button>
  
  {/* Sayaç */}
  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-sm 
                  px-2 py-1 rounded-full">
    {aktifIndex + 1} / {gorseller.length}
  </div>
</div>

{/* Alt thumbnail'lar - aktif olanı border ile vurgula */}
<div className="flex gap-2 mt-2">
  {gorseller.map((g, i) => (
    <button key={i} onClick={() => setAktifIndex(i)}
      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors
                  ${i === aktifIndex ? 'border-blue-500' : 'border-transparent'}`}>
      <Image src={g} alt="" fill className="object-cover" />
    </button>
  ))}
</div>
```

### 3.4 Benzer ilanlar boş
`/konaklama/[id]` sayfasında "Benzer İlanlar" bölümü boş geliyor.
```tsx
// Aynı tip ve konumdaki diğer ilanları çek:
const { data: benzerIlanlar } = await supabase
  .from('ilanlar')
  .select('*, ilan_medyalari(url, sira)')
  .eq('aktif', true)
  .eq('tip', ilan.tip)
  .neq('id', ilan.id)
  .limit(3)
```

---

## BÖLÜM 4 — ANA SAYFA SORUNLARI

### 4.1 "Ne Tür Tatil?" kategorileri eksik
Şu an 3 kategori var (Macera, Lüks, Romantik), Aile kategorisi eksik:
```tsx
const kategoriler = [
  { slug: 'macera', label: 'Macera', desc: 'Doğayla İç İçe Tatil', emoji: '🏔️' },
  { slug: 'luks', label: 'Lüks', desc: 'Konforun Zirvesi', emoji: '👑' },
  { slug: 'romantik', label: 'Romantik', desc: 'Unutulmaz Kaçamak', emoji: '💑' },
  { slug: 'aile', label: 'Aile', desc: 'Herkes İçin Eğlence', emoji: '👨‍👩‍👧‍👦' },
]
// 4. kategori (Aile) eksik, ekle
```

### 4.2 Paket kartı "Aile Tatil Paketi" tıklanamıyor
Ana sayfada son paket kartının ismi görünüyor ama fiyatı ve açıklaması yok, tıklanamıyor:
```
Hisaronunde aile villasinda 7 gece + gulet ile 12 adali tam gun turu. ₺24.100
```
Bu içerik yanlış yerde render ediliyor. Paket kartları için link kontrolü yap.

### 4.3 Header logo "Sezondakirala" — "SezondalKirala" olmalı
Header'da "Sezondakirala" yazıyor, "SezondalKirala" olmalı (büyük K).

### 4.4 Giriş/Kayıt butonları header'da Türkçe karakter sorunu
"Giris Yap" → "Giriş Yap", "Kayit Ol" → "Kayıt Ol" olmalı.

---

## BÖLÜM 5 — /konaklama SAYFASI SORUNLARI

### 5.1 Filtre sidebar çok basit
Şu an sadece 3 checkbox var (Wifi, Havuz, Klima). Genişlet:
```tsx
// Fiyat aralığı slider
// Kapasite seçimi (toggle butonlar)  
// Konum dropdown
// Yatak odası sayısı
// Tüm özellikler (en az 8 checkbox)
// Müsaitlik tarih seçici
// "Filtrele" ve "Temizle" butonları
```

### 5.2 Filtre URL parametrelerine yansımıyor
Filtreler tıklanınca URL değişmiyor, sayfa yenilince filtreler sıfırlanıyor.
```tsx
// router.push ile URL'i güncelle:
router.push(`/konaklama?wifi=${wifi}&havuz=${havuz}&fiyat_min=${min}&fiyat_max=${max}`)
```

### 5.3 Türkçe karakter sorunları
- "Oludeniz" → "Ölüdeniz"
- "Calis" → "Çalış"  
- "Gocek" → "Göcek"
- "Hisaronu" → "Hisarönü"
- "Kayakoy" → "Kayaköy"
- Tüm ilan başlıklarında ve konum bilgilerinde düzelt

---

## BÖLÜM 6 — /giris VE /kayit SAYFASI SORUNLARI

### 6.1 Giriş sayfası çok basit
Şu an sadece email + şifre alanı var, sayfa tamamen boş görünüyor.
```tsx
// İki kolonlu layout:
// Sol: Fethiye fotoğrafı + slogan (mobilde gizle)
// Sağ: Form kartı (beyaz, gölgeli, ortalı)

// Form içeriği:
// Logo
// "Tekrar Hoş Geldiniz" başlık
// Email input
// Şifre input (göster/gizle butonu)
// "Beni Hatırla" checkbox
// Giriş Yap butonu
// "Şifremi Unuttum" link
// "Hesabın yok mu? Kayıt Ol" link
```

### 6.2 Kayıt sayfasında rol seçimi yok
```tsx
// Hesap türü seçimi ekle (büyük kartlar):
// 🏖️ Tatilci — "Villa veya tekne kiralamak istiyorum"
// 🏠 İlan Sahibi — "Villam var, kiraya vermek istiyorum"

// Ad Soyad, Telefon alanları eksik — ekle
// Şifre güç göstergesi ekle
```

---

## BÖLÜM 7 — PAKET DETAY SAYFASI SORUNLARI

### 7.1 "Dahil Olan İlanlar" boş geliyor
```
Şu an: "Bu paket için tanımlı ilan bulunamadı."
```
```tsx
// paketler tablosundaki ilan_idleri (jsonb array) kullanarak ilanları çek:
const ilanIdleri = paket.ilan_idleri as string[]
const { data: ilanlar } = await supabase
  .from('ilanlar')
  .select('id, baslik, konum, gunluk_fiyat, ilan_medyalari(url)')
  .in('id', ilanIdleri)
```

### 7.2 Paket sayfası tasarımı boş
- Hero bölümü yok (kapak fotoğrafı, başlık, kategori badge)
- İçerik listesi düzgün değil
- Fiyat kartı sağda sticky olmalı

---

## BÖLÜM 8 — REZERVASYON WIZARD SORUNLARI

### 8.1 Adım validasyonu yok
Bilgi girmeden son adıma geçilebiliyor. Her adımda validasyon zorunlu:
- Adım 1: Tarih ve misafir girilmeden ileri gidilemez
- Adım 2: Ad, telefon, email girilmeden ileri gidilemez
- Adım 3: Ödeme yöntemi seçilmeden ileri gidilemez

### 8.2 Adım 1'deki "kişi sayısı" alanları anlamsız
İki ayrı input var, ne olduğu belli değil. Yetişkin/Çocuk/Bebek +/- butonlarıyla değiştir (arama_formu_prompt.md'deki gibi).

### 8.3 Adım göstergesi (stepper) görsel olarak zayıf
Aktif adım, tamamlanan adım ve bekleyen adım renkli ve net gösterilmeli.

---

## BÖLÜM 9 — GENEL SORUNLAR

### 9.1 WhatsApp numarası placeholder
`wa.me/905XXXXXXXXX` → `lib/constants.ts`'teki `WHATSAPP_NUMBER` sabitini gerçek numara ile güncelle.

### 9.2 Türkçe karakter — tüm proje
Grep ile tüm `.tsx` `.ts` dosyalarında tara:
```bash
grep -r "Oludeniz\|Gocek\|Hisaronu\|Kayakoy\|Calis\|Gulet\|Luks\|Ozel\|Musait\|Giris\|Cikis" app/ components/
```
Hepsini Türkçe karakterlerle değiştir.

### 9.3 Header logo büyük/küçük harf
"Sezondakirala" → "SezondalKirala" (büyük K)

### 9.4 Footer iletişim bilgileri placeholder
"+90 (XXX) XXX XX XX" gerçek numara ile değiştirilmeli (WHATSAPP_NUMBER ile aynı olabilir).

### 9.5 SSS sayfası içerik az
En az 10 soru-cevap olmalı, şu an kaç tane var kontrol et, eksikse ekle.

### 9.6 Hakkımızda sayfası çok boş
Tek satır metin var. Bölüm 4.9'daki tasarıma göre zenginleştir.

---

## BÖLÜM 10 — SONUNDA

```bash
npm run build
npm run lint
```

Şu test senaryolarını çalıştır ve raporla:
1. Ana sayfada video arka plan oyluyor mu? (ses yok, loop var)
2. İlan detay sayfasında takvim tıklanıyor mu? Arkada kalmıyor mu?
3. Tarih seçince fiyat hesaplama anlık güncelleniyor mu?
4. Galeri ana görselinde ← → ok butonları çalışıyor mu?
5. Aile kategorisi "Ne Tür Tatil?" bölümünde görünüyor mu?
6. Paket detayında "Dahil Olan İlanlar" geliyor mu?
7. Rezervasyon wizard adım 1'de tarih girilmeden ileri gidilemiyor mu?
8. Türkçe karakterler düzeldi mi? (Ölüdeniz, Göcek, Hisarönü vb.)
9. Header'da "SezondalKirala" yazıyor mu? (büyük K)
10. Giriş/Kayıt sayfaları görsel olarak düzgün mü?
