# SezondalKirala — Master Geliştirme Promptu (V4)

Siteyi baştan sona inceledim. Aşağıdaki sorunları sırayla düzelt. Her bölüm bittikten sonra `npm run build` al, hata varsa düzelt, devam et.

---

## BÖLÜM 0 — KRİTİK MANTIK HATALARI (İLK ÖNCE BUNLAR)

### 0.1 Rezervasyon wizard — adım doğrulaması
**Mevcut sorun:** Hiçbir bilgi girmeden direkt son adıma (ödeme) geçilebiliyor. Bu çok ciddi bir UX ve güvenlik hatasıdır.

**Çözüm:** Her adımda ileri butonuna basılınca önce validasyon yap, geçersizse bir sonraki adıma gitme.

```ts
// Adım 1 validasyon — tarih ve misafir zorunlu
const adim1Gecerli = () => {
  if (!girisTarihi) { toast.error('Giriş tarihi seçiniz'); return false }
  if (!cikisTarihi) { toast.error('Çıkış tarihi seçiniz'); return false }
  if (cikisTarihi <= girisTarihi) { toast.error('Çıkış tarihi giriş tarihinden sonra olmalı'); return false }
  if (yetiskin < 1) { toast.error('En az 1 yetişkin gerekli'); return false }
  const toplamMisafir = yetiskin + cocuk
  if (toplamMisafir > ilan.kapasite) { toast.error(`Bu villa maksimum ${ilan.kapasite} kişi kapasitelidir`); return false }
  return true
}

// Adım 2 validasyon — kişisel bilgiler zorunlu
const adim2Gecerli = () => {
  if (!adSoyad.trim()) { toast.error('Ad soyad zorunludur'); return false }
  if (!telefon.trim() || telefon.length < 10) { toast.error('Geçerli bir telefon giriniz'); return false }
  if (!email.trim() || !email.includes('@')) { toast.error('Geçerli bir email giriniz'); return false }
  return true
}

// Adım 3 validasyon — ödeme yöntemi seçilmeli
const adim3Gecerli = () => {
  if (!odemeYontemi) { toast.error('Ödeme yöntemi seçiniz'); return false }
  return true
}

// İleri butonuna basılınca
const ileriBas = () => {
  if (aktifAdim === 1 && !adim1Gecerli()) return
  if (aktifAdim === 2 && !adim2Gecerli()) return
  if (aktifAdim === 3 && !adim3Gecerli()) return
  setAktifAdim(prev => prev + 1)
}
```

### 0.2 Rezervasyon wizard — adım 1 içeriği düzelt
**Mevcut sorun:** Adım 1'de "kişi sayısı" için anlamsız iki kutu var, ne olduğu belli değil.

**Çözüm:** Adım 1'i tamamen yeniden yaz:

```
ADIM 1 — Rezervasyon Detayları
================================

[İlan adı ve görseli — küçük özet kart]

Giriş Tarihi *
[📅 Tarih seçici — react-day-picker]

Çıkış Tarihi *
[📅 Tarih seçici — giriş seçilince aktif olur]

Misafir Sayısı *
  Yetişkin (13+)   [−] 2 [+]
  Çocuk (2-12)     [−] 0 [+]
  Bebek (0-2)      [−] 0 [+]

Özel İstek (opsiyonel)
[textarea]

Fiyat Özeti:
  7 gece × ₺4.500  = ₺31.500
  Temizlik ücreti   =    ₺500
  ─────────────────────────
  Toplam            = ₺32.000

[İleri →]
```

### 0.3 Rezervasyon — giriş zorunluluğu
Kullanıcı giriş yapmadan rezervasyon sayfasına gelirse:
- `/giris?redirect=/konaklama/[id]` sayfasına yönlendir
- Mesaj: "Rezervasyon yapmak için giriş yapmanız gerekmektedir"
- Giriş sonrası otomatik ilan sayfasına dön

### 0.4 Ana sayfada slug undefined
İlan kartlarındaki linkler `/konaklama/undefined` gidiyor.
```ts
// Düzelt:
const ilanUrl = `/konaklama/${ilan.slug ?? ilan.id}`
```
Tüm ilan kartlarında (ana sayfa dahil) kontrol et.

### 0.5 Admin paneli kullanıcı listesi
`/yonetim/kullanicilar` boş geliyor.
```ts
// createAdminClient() kullan, createClient() değil
const adminClient = createAdminClient() // service_role key
const { data } = await adminClient
  .from('kullanicilar')
  .select('*')
  .order('olusturulma_tarihi', { ascending: false })
```

### 0.6 Panel rezervasyonlar boş
```ts
// Server component'te server client kullan
const supabase = createClient() // server.ts
const { data: { user } } = await supabase.auth.getUser()
const { data } = await supabase
  .from('rezervasyonlar')
  .select('*, ilanlar(baslik, konum, ilan_medyalari(url))')
  .eq('kullanici_id', user.id)
  .order('olusturulma_tarihi', { ascending: false })
```
RLS policy kontrol et, yoksa ekle:
```sql
CREATE POLICY "kullanici_kendi_rezervasyonlarini_gorur" ON rezervasyonlar
FOR SELECT USING (auth.uid() = kullanici_id);
```

---

## BÖLÜM 1 — ARAMA FORMU (arama_formu_prompt.md içeriği)

### 1.1 Tarih seçici — react-day-picker ile yeniden yaz

**Genel davranış:**
- Giriş tarihi seçilince çıkış takvimi otomatik açılsın
- Çıkış takviminde giriş tarihinden önceki tüm günler disabled ve gri
- Geçmiş tarihler her zaman disabled
- Takvim açıkken dışarı tıklayınca kapansın
- İki takvim yan yana (masaüstü), tek (mobil)

**CSS renk kodları:**
```css
.rdp-day_selected { background: #0EA5E9; color: white; border-radius: 50%; }
.rdp-day_range_middle { background: #DBEAFE; color: #1E40AF; border-radius: 0; }
.rdp-day_range_start { border-radius: 50% 0 0 50%; }
.rdp-day_range_end { border-radius: 0 50% 50% 0; }
.rdp-day:hover:not(.rdp-day_disabled) { background: #F1F5F9; }
.rdp-day_disabled { color: #CBD5E1; cursor: not-allowed; opacity: 0.5; }
```

**Tarih gösterim formatı:**
```
Giriş:  "25 Haz 2026"
Çıkış:  "2 Tem 2026"
Alt:    "(7 gece)"
```

### 1.2 Misafir seçici — dropdown panel
Misafir alanına tıklanınca dropdown açılsın:
```
┌──────────────────────────────┐
│  Yetişkin  (13 yaş üstü)     │
│  [−]        2        [+]     │
│                              │
│  Çocuk  (2–12 yaş)          │
│  [−]        0        [+]     │
│                              │
│  Bebek  (0–2 yaş)           │
│  [−]        0        [+]     │
│                              │
│  [       Uygula       ]      │
└──────────────────────────────┘
```
- Yetişkin min:1 max:20, Çocuk min:0 max:10, Bebek min:0 max:5
- Butonlar: 32px daire, border #CBD5E1, hover border #0EA5E9
- Alan gösterimi: "2 yetişkin · 1 çocuk"
- `useEffect` + mousedown ile dışarı tıklayınca kapat

### 1.3 URL parametreleri
```
/konaklama?giris=2026-06-25&cikis=2026-07-02&yetiskin=2&cocuk=1&bebek=0
```
Sayfalar searchParams ile okusun, geceSayisi hesaplasın.

### 1.4 Villa listesinde fiyat hesaplama
- Tarih seçilmemişse: `₺4.500 / gece`
- Tarih seçilmişse: `₺31.500 toplam` (alt: `₺4.500/gece · 7 gece`)
- Kapasite filtresi: `yetiskin + cocuk <= ilan.kapasite`

### 1.5 Filtre özet bandı
Listenin üstünde, tarih/misafir girilmişse göster:
```
📅 25 Haz – 2 Tem  🌙 7 gece  👥 2 yetişkin · 1 çocuk
Fethiye genelinde 4 müsait villa bulundu    [Temizle ✕]
```
Stil: `background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px;`

### 1.6 Müsaitlik filtresi (Supabase)
```ts
const doluIlanlar = await supabase.from('musaitlik')
  .select('ilan_id').gte('tarih', giris).lt('tarih', cikis).eq('durum', 'dolu')

const rezervasyonluIlanlar = await supabase.from('rezervasyonlar')
  .select('ilan_id').in('durum', ['beklemede','onaylandi'])
  .lt('giris_tarihi', cikis).gt('cikis_tarihi', giris)

const doluIdler = [...new Set([...doluIlanlar.map(d=>d.ilan_id), ...rezervasyonluIlanlar.map(r=>r.ilan_id)])]
if (doluIdler.length > 0) query = query.not('id', 'in', `(${doluIdler.join(',')})`)
```

### 1.7 İlan detay — otomatik doldurma
URL'den parametreler geliyorsa tarih + misafir otomatik dolu, fiyat anında hesaplansın.

### 1.8 SearchForm — tek component
`components/SearchForm.tsx` Client Component olarak yaz.
Ana sayfa hero'sunda ve /konaklama sidebar'ında aynı component kullanılsın.

---

## BÖLÜM 2 — GÖRSEL KALİTE & İKONLAR

### 2.1 İkon sistemi — lucide-react kullan
Tüm emoji ikonları (`🛏️`, `🚿`, `👥` vb.) kaldır, `lucide-react` ikonlarıyla değiştir:

```tsx
import { Bed, Bath, Users, MapPin, Star, Heart, Wifi, 
         Waves, Wind, Car, ChefHat, Tv, Anchor, 
         Calendar, Search, Phone, Mail, ChevronLeft, 
         ChevronRight, Check, X, Plus, Minus, 
         Shield, Award, Clock, Home, Sailboat } from 'lucide-react'

// Kullanım örnekleri:
<Bed size={16} className="text-gray-500" />         // yatak odası
<Bath size={16} className="text-gray-500" />        // banyo
<Users size={16} className="text-gray-500" />       // kapasite
<MapPin size={14} className="text-blue-500" />      // konum
<Star size={14} className="text-yellow-400 fill-yellow-400" /> // yıldız
<Heart size={18} className="text-gray-400 hover:text-red-500" /> // favori
<Wifi size={16} />  <Waves size={16} />  <Wind size={16} />    // özellikler
```

### 2.2 Türkçe karakter düzeltmesi — tüm projede
Proje genelinde bul-değiştir:
- `Oludeniz` → `Ölüdeniz`
- `Gocek` → `Göcek`
- `Hisaronu` → `Hisarönü`
- `Kayakoy` → `Kayaköy`
- `Calis` → `Çalış`
- `Gulet` → `Gület`
- `Luks` → `Lüks`
- `Ozel` → `Özel`
- `Musaitlik` (UI metni) → `Müsaitlik`
- `Giris` (UI metni) → `Giriş`
- `Cikis` (UI metni) → `Çıkış`
- `One Cikan` → `Öne Çıkan`
- `Fiyat Hesaplayici` → `Fiyat Hesaplayıcı`
- `Sifre` (UI metni) → `Şifre`
- Takvim günleri İngilizce (`Mo, Tu, We`) → Türkçe (`Pzt, Sal, Çar, Per, Cum, Cmt, Paz`)
- Takvim ayları İngilizce → Türkçe (Ocak, Şubat, Mart...)

### 2.3 Marka adı düzeltmesi
Tüm dosyalarda:
- `Sezonda|Kirala` → `SezondalKirala`
- `Sezonda Kirala` → `SezondalKirala`
- `lib/constants.ts`'e ekle: `export const SITE_NAME = 'SezondalKirala'`

---

## BÖLÜM 3 — TASARIM SİSTEMİ

### 3.1 Google Fonts — Inter ekle
`app/layout.tsx`'e:
```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })
// <html className={inter.className}>
```

### 3.2 Tailwind renk sistemi
`tailwind.config.ts`'e ekle:
```ts
extend: {
  colors: {
    primary: { DEFAULT: '#0EA5E9', dark: '#0284C7', light: '#BAE6FD' },
    secondary: { DEFAULT: '#22C55E', dark: '#16A34A', light: '#BBF7D0' },
    accent: '#F59E0B',
    dark: '#0F172A',
    surface: '#F8FAFC',
  },
  boxShadow: {
    card: '0 2px 20px rgba(0,0,0,0.08)',
    'card-hover': '0 8px 40px rgba(0,0,0,0.15)',
  },
  borderRadius: {
    card: '16px',
    btn: '12px',
  }
}
```

### 3.3 Global stiller
`globals.css`'e ekle:
```css
body { background-color: #F8FAFC; color: #1E293B; }

/* Kart */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.08);
  transition: box-shadow 0.3s, transform 0.3s;
}
.card:hover {
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  transform: translateY(-4px);
}

/* Buton */
.btn-primary {
  background: #0EA5E9;
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  transition: background 0.2s, transform 0.15s;
}
.btn-primary:hover { background: #0284C7; transform: scale(1.02); }

.btn-secondary {
  background: #22C55E;
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
}
.btn-secondary:hover { background: #16A34A; }

/* Input */
.input-field {
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 15px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-field:focus {
  outline: none;
  border-color: #0EA5E9;
  box-shadow: 0 0 0 3px rgba(14,165,233,0.1);
}

/* Badge */
.badge { border-radius: 99px; padding: 4px 12px; font-size: 12px; font-weight: 600; }
.badge-blue { background: #DBEAFE; color: #1D4ED8; }
.badge-green { background: #DCFCE7; color: #166534; }
.badge-amber { background: #FEF3C7; color: #92400E; }
.badge-red { background: #FEE2E2; color: #991B1B; }

/* Shimmer skeleton */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
```

---

## BÖLÜM 4 — SAYFA SAYFA YENİDEN TASARIM

### 4.1 Header — tamamen yeniden yaz
```tsx
// components/Header.tsx
// Scroll olmadan: şeffaf arka plan (hero üzerinde)
// Scroll sonra: beyaz bg + backdrop-blur + shadow
// Yükseklik: 72px

<header className="fixed top-0 w-full z-50 transition-all duration-300"
  style={{ background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
           backdropFilter: scrolled ? 'blur(12px)' : 'none',
           boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.1)' : 'none' }}>

  {/* Logo */}
  <span className="text-xl font-bold text-primary">SezondalKirala</span>

  {/* Nav — masaüstü */}
  <nav> Ana Sayfa | Konaklama | Tekneler | Paketler | Hakkımızda </nav>

  {/* Sağ */}
  {user ? <UserDropdown /> : <><GirisBtn /><KayitBtn /></>}

  {/* Mobil hamburger */}
  <MobileMenu />
</header>
```

Mobil drawer: sağdan kayar, overlay backdrop, X butonu.

### 4.2 Ana sayfa hero — yeniden yaz
```tsx
// Tam ekran hero, fotoğraf + koyu gradient
<section className="relative min-h-screen flex items-center justify-center">
  {/* Arka plan */}
  <div className="absolute inset-0">
    <Image src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920"
      alt="Fethiye" fill className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
  </div>

  {/* İçerik */}
  <div className="relative z-10 text-center text-white px-4">
    {/* Rozet */}
    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm
      rounded-full px-4 py-2 mb-6 text-sm font-medium">
      <Award size={14} /> Fethiye'nin #1 Villa Platformu
    </div>

    <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight">
      Hayalinizdeki Tatil<br />
      <span className="text-sky-400">Fethiye'de Başlar</span>
    </h1>

    <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto">
      500+ mutlu misafir, TURSAB güvencesiyle lüks villa ve tekne deneyimi
    </p>

    {/* Arama formu — beyaz kart */}
    <SearchForm />

    {/* İstatistikler */}
    <div className="flex flex-wrap justify-center gap-8 mt-10">
      {[['🏠','50+','Villa'],['⛵','20+','Tekne'],['⭐','4.9','Puan'],['✅','TURSAB','Güvencesi']]
        .map(([icon,num,label]) => (
        <div key={label} className="text-center">
          <div className="text-2xl font-bold">{icon} {num}</div>
          <div className="text-white/70 text-sm">{label}</div>
        </div>
      ))}
    </div>
  </div>
</section>
```

### 4.3 Güven bandı
Hero altında, beyaz arka plan:
```tsx
<div className="bg-white shadow-sm py-4">
  <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8">
    {[
      [Shield, 'SSL Güvenli Ödeme'],
      [Check, 'Admin Onaylı İlanlar'],
      [Phone, '7/24 WhatsApp Destek'],
      [Award, 'TURSAB Belgeli'],
      [Clock, 'Anında Rezervasyon'],
    ].map(([Icon, text]) => (
      <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
        <Icon size={18} className="text-primary" />
        {text}
      </div>
    ))}
  </div>
</div>
```

### 4.4 İlan kartı — yeniden yaz
```tsx
// components/IlanKart.tsx
<div className="card group cursor-pointer overflow-hidden">
  {/* Görsel */}
  <div className="relative aspect-[4/3] overflow-hidden">
    <Image src={kapakGorsel} alt={ilan.baslik} fill
      className="object-cover group-hover:scale-105 transition-transform duration-500" />
    {/* Favori */}
    <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full
      flex items-center justify-center shadow hover:bg-white transition-colors">
      <Heart size={16} className="text-gray-400 hover:text-red-500" />
    </button>
    {/* Sponsorlu badge */}
    {ilan.sponsorlu && (
      <span className="absolute top-3 left-3 badge badge-amber">
        ⭐ Öne Çıkan
      </span>
    )}
  </div>

  {/* İçerik */}
  <div className="p-4">
    {/* Konum */}
    <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
      <MapPin size={12} /> {ilan.konum}
    </div>
    {/* Başlık */}
    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{ilan.baslik}</h3>
    {/* Özellikler */}
    <div className="flex items-center gap-4 text-gray-500 text-sm mb-3">
      <span className="flex items-center gap-1"><Bed size={14}/> {ilan.yatak_odasi}</span>
      <span className="flex items-center gap-1"><Bath size={14}/> {ilan.banyo}</span>
      <span className="flex items-center gap-1"><Users size={14}/> {ilan.kapasite}</span>
    </div>
    {/* Yıldız */}
    {yorumOrtalaması && (
      <div className="flex items-center gap-1 text-sm mb-3">
        <Star size={14} className="text-yellow-400 fill-yellow-400" />
        <span className="font-medium">{yorumOrtalaması}</span>
        <span className="text-gray-400">({yorumSayisi} yorum)</span>
      </div>
    )}
    {/* Fiyat */}
    <div className="flex items-center justify-between">
      <div>
        {geceSayisi ? (
          <>
            <span className="text-lg font-bold text-gray-900">
              ₺{(ilan.gunluk_fiyat * geceSayisi + ilan.temizlik_ucreti).toLocaleString('tr-TR')} toplam
            </span>
            <div className="text-xs text-gray-500">₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}/gece · {geceSayisi} gece</div>
          </>
        ) : (
          <span className="text-lg font-bold text-gray-900">
            ₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')} <span className="text-sm font-normal text-gray-500">/ gece</span>
          </span>
        )}
      </div>
      <Link href={`/konaklama/${ilan.slug ?? ilan.id}`}
        className="btn-primary text-sm py-2 px-4">
        İncele
      </Link>
    </div>
  </div>
</div>
```

### 4.5 Paket kartı — tıklanabilir yap
```tsx
// /paketler/[id] sayfası oluştur
// Paket kartına Link ekle:
<Link href={`/paketler/${paket.id}`}>
  <div className="card group cursor-pointer overflow-hidden">
    {/* Görsel — tam genişlik */}
    <div className="relative h-48 overflow-hidden">
      <Image src={paketGorseli} alt={paket.baslik} fill className="object-cover
        group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <span className={`absolute top-3 left-3 badge ${kategoriRenk[paket.kategori]}`}>
        {paket.kategori}
      </span>
    </div>
    {/* İçerik */}
    <div className="p-5">
      <h3 className="font-bold text-lg mb-2">{paket.baslik}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{paket.aciklama}</p>
      <div className="flex gap-4 text-sm text-gray-500 mb-4">
        <span className="flex items-center gap-1"><Clock size={14}/> {paket.sure_gun} gün</span>
        <span className="flex items-center gap-1"><Users size={14}/> Max {paket.kapasite} kişi</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xl font-bold text-primary">₺{paket.fiyat.toLocaleString('tr-TR')}</span>
          <span className="text-gray-500 text-sm"> toplam</span>
        </div>
        <span className="btn-primary text-sm py-2 px-4">İncele →</span>
      </div>
    </div>
  </div>
</Link>
```

### 4.6 /paketler/[id] sayfası oluştur
```tsx
// app/paketler/[id]/page.tsx
// İki kolon layout:
// Sol (2/3): paket adı, açıklama, dahil ilanlar (mini kart), program
// Sağ (1/3 sticky): fiyat kartı, rezervasyon butonu, WhatsApp butonu, TURSAB badge
```

### 4.7 Kayıt sayfası — rol seçimi ekle
```tsx
// /kayit sayfasına ekle:
// Ad Soyad, Email, Telefon, Şifre, Şifre tekrarı
// Hesap türü — büyük seçim kartları:
//   🏖️ Tatilci — "Villa veya tekne kiralamak istiyorum"
//   🏠 İlan Sahibi — "Villam var, kiraya vermek istiyorum"
// Giriş sonrası rol bazlı yönlendirme
```

### 4.8 Giriş/kayıt sayfaları — görsel iyileştirme
```tsx
// Sayfayı iki kolona böl:
// Sol (yarı): Fethiye fotoğrafı + slogan + TURSAB badge
// Sağ (yarı): Form
// Mobilde: sadece form, fotoğraf gizle
```

### 4.9 Hakkımızda sayfası — tamamen yeniden yaz
```tsx
// Hero bölümü: büyük başlık + Fethiye görseli
// Hikayemiz: 2 paragraf
// Rakamlar (animasyonlu sayaç): 500+ Misafir | 50+ Villa | 7 Yıl | %98
// TURSAB bölümü: büyük badge + açıklama
// İletişim CTA
```

### 4.10 Footer — tamamen yeniden yaz
```tsx
// 4 kolon, koyu arka plan (#0F172A)
// Kolon 1: Logo + açıklama + sosyal medya ikonları (lucide-react)
// Kolon 2: Hızlı linkler
// Kolon 3: Hizmetler
// Kolon 4: İletişim bilgileri
// Alt bar: "© 2026 SezondalKirala is Powered by Xanthos Dijital. Tüm Hakları Saklıdır."
//           + TURSAB badge sağda
// Bölümler arası üstte dalga SVG divider
```

---

## BÖLÜM 5 — İLAN DETAY SAYFASI

### 5.1 Fotoğraf galerisi — sağ/sol ok butonları
```tsx
// Lightbox için: npm install yet-another-react-lightbox
import Lightbox from 'yet-another-react-lightbox'

// Ana galeri:
// Sol 2/3: büyük kapak fotoğrafı
// Sağ 1/3: 2 küçük fotoğraf + "+X daha" overlay
// Tıklanınca lightbox açılır

// Lightbox içinde:
// ← → ok butonları (büyük, yarı şeffaf daire)
// Alt thumbnail şeridi
// Fotoğraf sayacı "3 / 8"
// ESC ile kapat, swipe desteği
```

### 5.2 Fiyat hesaplama kartı
```tsx
// Sağ sticky kart:
<div className="card p-6 sticky top-24">
  <div className="text-2xl font-bold mb-4">₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}
    <span className="text-base font-normal text-gray-500"> / gece</span>
  </div>

  {/* Tarih seçici */}
  <DateRangePicker ... />

  {/* Misafir seçici */}
  <GuestPicker ... />

  {/* Fiyat özeti (tarih seçilince göster) */}
  {geceSayisi && (
    <div className="border rounded-xl p-4 mb-4 bg-gray-50">
      <div className="flex justify-between text-sm mb-2">
        <span>₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')} × {geceSayisi} gece</span>
        <span>₺{(ilan.gunluk_fiyat * geceSayisi).toLocaleString('tr-TR')}</span>
      </div>
      <div className="flex justify-between text-sm mb-3">
        <span>Temizlik ücreti</span>
        <span>₺{ilan.temizlik_ucreti.toLocaleString('tr-TR')}</span>
      </div>
      <hr className="mb-3"/>
      <div className="flex justify-between font-bold">
        <span>Toplam</span>
        <span>₺{(ilan.gunluk_fiyat * geceSayisi + ilan.temizlik_ucreti).toLocaleString('tr-TR')}</span>
      </div>
    </div>
  )}

  <Link href={`/rezervasyon/${ilan.id}?giris=${giris}&cikis=${cikis}&yetiskin=${yetiskin}&cocuk=${cocuk}`}
    className="btn-primary w-full text-center block mb-3">
    Rezervasyon Yap
  </Link>

  <a href={`https://wa.me/${WHATSAPP_NUMBER}`}
    className="btn-secondary w-full text-center block">
    <Phone size={16} className="inline mr-2" />WhatsApp ile Sor
  </a>

  {/* TURSAB */}
  <div className="text-center text-xs text-gray-400 mt-4">
    <Shield size={12} className="inline mr-1" />TURSAB Üyesidir — Belge No: {TURSAB_NO}
  </div>
</div>
```

---

## BÖLÜM 6 — REZERVASYON WIZARD

### 6.1 Adım göstergesi (stepper)
```tsx
// 4 adım, üstte progress bar
// Aktif adım: mavi dolu daire + bold metin
// Tamamlanan: yeşil daire + check ikonu
// Bekleyen: gri daire

<div className="flex items-center justify-center gap-0 mb-8">
  {adimlar.map((adim, i) => (
    <>
      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold
        ${aktifAdim > i+1 ? 'bg-green-500 text-white' :
          aktifAdim === i+1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
        {aktifAdim > i+1 ? <Check size={18}/> : i+1}
      </div>
      {i < 3 && <div className={`h-1 w-16 ${aktifAdim > i+1 ? 'bg-green-500' : 'bg-gray-200'}`}/>}
    </>
  ))}
</div>
```

### 6.2 Adım 1 — Rezervasyon Detayları
İçerik (Bölüm 0.2'de detaylandırıldı):
- Giriş/çıkış tarihi
- Misafir sayısı (yetişkin/çocuk/bebek)
- Özel istek
- Fiyat özeti
- Validasyon: hepsi girilmeden İleri'ye geçilemiyor

### 6.3 Adım 2 — Kişisel Bilgiler
```tsx
// Ad Soyad *, Telefon *, Email * — react-hook-form + zod
// Telefon formatı: 05XX XXX XX XX
// Validasyon geçmeden İleri'ye geçilemiyor
```

### 6.4 Adım 3 — Ödeme
```tsx
// Ödeme yöntemi seçimi (büyük radio kartlar):
//   💳 Kredi/Banka Kartı
//   🏦 Havale/EFT

// Kredi kartı seçilirse:
//   Kart numarası (otomatik boşluk: 4444 4444 4444 4444)
//   Ad Soyad, Son Kullanma (AA/YY), CVV
//   Visa/Mastercard logo otomatik detect
//   "3D Secure korumalı" rozeti

// Havale seçilirse:
//   IBAN, Banka adı, Hesap adı, Açıklama (referans no)

// Güven rozetleri: 🔒 SSL | ✅ TURSAB | 💯 Güvenli
// Validasyon: yöntem seçilmeden İleri'ye geçilemiyor
```

### 6.5 Adım 4 — Onay
```tsx
// Animasyonlu yeşil tik (framer-motion scale 0→1)
// Referans no: SZK-{YYYYMMDD}-{random4}
// Rezervasyon özeti tablosu
// "📧 Onay emaili gönderildi" mesajı
// [Rezervasyonlarıma Git] [WhatsApp ile İletişim] butonları
// TURSAB badge
```

---

## BÖLÜM 7 — ANİMASYONLAR

`npm install framer-motion` (yoksa)

```tsx
// 1. Sayfa geçişi — tüm sayfalara
'use client'
import { motion } from 'framer-motion'
export default function Page() {
  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}
      transition={{duration:0.4}}>
      {/* içerik */}
    </motion.div>
  )
}

// 2. Kart grid — staggered
const container = { animate: { transition: { staggerChildren: 0.1 } } }
const item = { initial:{opacity:0, y:30}, animate:{opacity:1, y:0} }

// 3. Sayaç animasyonu (Intersection Observer ile)
// 0'dan hedefe 2 saniyede

// 4. CSS transitions — tüm kartlarda:
className="transition-all duration-300 hover:-translate-y-2 hover:shadow-card-hover"

// 5. WhatsApp butonu — pulse
className="animate-pulse" // veya custom keyframe
```

---

## BÖLÜM 8 — MOBİL

- Header hamburger: sağdan drawer, overlay backdrop
- Hero arama formu: 2 kolon → 1 kolon (sm breakpoint)
- İlan detay: sticky bottom bar
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 flex gap-3 md:hidden">
    <div className="flex-1">
      <div className="font-bold">₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}/gece</div>
    </div>
    <Link href="..." className="btn-primary flex-1 text-center">Rezervasyon Yap</Link>
    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="btn-secondary px-4">
      <Phone size={18}/>
    </a>
  </div>
  ```
- WhatsApp fixed butonu: `fixed bottom-24 right-4 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg`
- Tüm touch target min 48px
- Filtre sidebar: bottom sheet (drawer)

---

## BÖLÜM 9 — GENEL POLİSH

- Tüm `console.log` sil
- Skeleton loading: her data-fetch'te shimmer göster
- Empty state: "Henüz ilan yok" — ikon + açıklama + CTA
- 404 sayfası: Türkçe, güzel tasarım
- Form hata mesajları Türkçe (zod)
- `npm install yet-another-react-lightbox` (galeri için)

---

## SONUNDA

```bash
npm run build && npm run lint
```

Şu senaryoları test et ve raporla:
1. Ana sayfa → tarih + misafir seç → Ara → /konaklama filtreli açılıyor mu?
2. İlan kartı fiyatı toplam gösteriyor mu?
3. İlana tıkla → galeri ← → okları çalışıyor mu?
4. Rezervasyon yap → adım 1'de tarih/misafir girilmeden ileri geçilemiyor mu?
5. Paket kartına tıkla → /paketler/[id] sayfası açılıyor mu?
6. Giriş yapmadan rezervasyon → /giris?redirect=... yönleniyor mu?
7. /panel/rezervasyonlar → rezervasyonlar görünüyor mu?
8. /yonetim/kullanicilar → kullanıcılar listesi geliyor mu?
9. Tüm Türkçe karakterler düzgün mü? (Ölüdeniz, Göcek vb.)
10. Mobilde sticky bottom bar görünüyor mu?
