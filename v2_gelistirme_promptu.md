# SezondalKirala — V2 Kapsamlı Geliştirme Promptu

Aşağıdaki tüm geliştirmeleri sırayla uygula. Her bölüm bittikten sonra `npm run build` çalıştır, hata varsa düzelt, sonra devam et.

---

## BÖLÜM 1 — KRİTİK BUGLAR (İLK ÖNCE BUNLAR)

### 1.1 Marka adı — Tüm projede düzelt
Projede "Sezonda|Kirala", "Sezonda Kirala", "SezondalKirala" gibi farklı yazımlar var.
- Tüm dosyalarda bul-değiştir yap
- Doğru yazım: **SezondalKirala** (tek kelime, büyük S ve K)
- Logo metni, title tagları, meta tagları, footer, email şablonları, sabit metinler — hepsinde düzelt
- `lib/constants.ts`'e `SITE_NAME = "SezondalKirala"` ekle ve heryerde bu sabiti kullan

### 1.2 Footer — Tamamen yeniden yaz
Footer'ı kaldır ve sıfırdan yaz. İçerik:

**Sol kolon — Logo & Açıklama:**
- SezondalKirala logosu
- "Fethiye'nin en güvenilir villa ve tekne kiralama platformu. TURSAB güvencesiyle unutulmaz tatil deneyimleri."
- Sosyal medya ikonları: Instagram, Facebook, Twitter/X, YouTube (href="#" placeholder)

**2. Kolon — Hızlı Linkler:**
- Ana Sayfa, Konaklama, Tekneler, Paketler, Hakkımızda, SSS, İletişim

**3. Kolon — Hizmetler:**
- Villa Kiralama, Tekne Kiralama, Tatil Paketleri, Özel Turlar, Transfer Hizmeti, Havalimanı Karşılama

**4. Kolon — İletişim:**
- 📍 Fethiye, Muğla, Türkiye
- 📞 +90 (XXX) XXX XX XX
- ✉️ info@sezondalkirala.com
- 🕐 Pazartesi–Cumartesi: 09:00–18:00

**Alt bar (copyright):**
```
© 2026 SezondalKirala is Powered by Xanthos Dijital. Tüm Hakları Saklıdır.
```
Sağ tarafta: TURSAB Üyesidir — Belge No: 14382 (belirgin badge)

Footer arka planı: koyu (#0f172a), yazılar beyaz/gri tonları

### 1.3 Türkçe karakter düzeltmesi — Tüm projede
Tüm hardcoded Türkçe metinleri tara ve düzelt:
- Oludeniz → Ölüdeniz
- Gocek → Göcek
- Hisarounu / Hisaronu → Hisarönü
- Kayakoy → Kayaköy
- Calis → Çalış
- Luks → Lüks
- Ozel → Özel
- Tekne → (zaten doğru)
- Gulet → Gület
- Suru → Sürü
- Musait → Müsait
- Doluluk → (zaten doğru)
- One Cikan → Öne Çıkan
- Giris → Giriş
- Cikis → Çıkış
- Ozellik → Özellik
- Rezervasyon Onayi → Rezervasyon Onayı
- Tüm sayfalarda, tüm bileşenlerde, seed verilerinde bu değişiklikleri yap
- `layout.tsx`'te `<html lang="tr">` ve `<meta charset="utf-8">` olduğunu doğrula

### 1.4 Ana sayfada slug sorunu
Ana sayfadaki ilan kartları `/konaklama/undefined` gidiyor.
- İlan sorgusuna `id` ve `slug` alanlarını ekle
- Link: `href={\`/konaklama/${ilan.slug ?? ilan.id}\`}`

---

## BÖLÜM 2 — MÜSAİTLİK & TAKVİM SİSTEMİ (KRİTİK)

Bu sistem sitenin en önemli özelliği. Airbnb ve hepsivilla.com mantığıyla çalışacak.

### 2.1 Müsaitlik veri modeli
`musaitlik` tablosu zaten var: `id, ilan_id, tarih, durum (musait|dolu|ozel_fiyat), fiyat_override`
`sezon_fiyatlari` tablosu: `id, ilan_id, baslangic_tarihi, bitis_tarihi, gunluk_fiyat`

### 2.2 Admin paneli — Takvim yönetimi (/yonetim/ilanlar/[id]/takvim)
Admin her ilanın takvimini yönetebilecek:

**Görünüm:**
- Aylık takvim görünümü (react-day-picker ile özel render)
- Renk kodları:
  - 🟢 Yeşil = Müsait (varsayılan)
  - 🔴 Kırmızı = Dolu (rezervasyon var veya manuel bloke)
  - 🟡 Sarı = Özel fiyat (sezon fiyatı aktif)
  - 🔵 Mavi = Onaylanmış rezervasyon

**İşlemler:**
- Tek gün seç → "Dolu İşaretle" veya "Müsait Yap" butonu
- Tarih aralığı seç (drag veya shift+click) → toplu işlem
- "Dolu İşaretle" → `musaitlik` tablosuna `durum: 'dolu'` ekle
- "Müsait Yap" → `musaitlik` tablosundan kaydı sil veya `durum: 'musait'` yap
- "Özel Fiyat" → fiyat input'u çıksın, `sezon_fiyatlari` tablosuna ekle

**Sezon Fiyatları Paneli (aynı sayfada):**
- Tablo: Başlangıç tarihi | Bitiş tarihi | Gecelik fiyat | Sil
- "Yeni Sezon Fiyatı Ekle" → tarih aralığı + fiyat form
- Kaydet → `sezon_fiyatlari` tablosuna ekle
- Örnekler: Yüksek sezon (Temmuz-Ağustos) ₺8.000/gece, Normal (Mayıs-Haziran) ₺5.000/gece

### 2.3 Ana sayfa arama — Müsaitlik filtresi
Kullanıcı tarih aralığı girdiğinde:
```sql
-- O tarih aralığında dolu olan ilanları hariç tut
SELECT * FROM ilanlar 
WHERE aktif = true
AND id NOT IN (
  SELECT DISTINCT ilan_id FROM musaitlik 
  WHERE tarih >= giris_tarihi 
  AND tarih < cikis_tarihi 
  AND durum = 'dolu'
)
AND id NOT IN (
  SELECT DISTINCT ilan_id FROM rezervasyonlar
  WHERE durum IN ('beklemede', 'onaylandi')
  AND giris_tarihi < cikis_tarihi_arama
  AND cikis_tarihi > giris_tarihi_arama
)
```
Bu sorguyu Supabase RPC (stored procedure) olarak yaz: `musait_ilanlar_getir(giris, cikis, misafir_sayisi)`

### 2.4 İlan detay sayfası — Takvim gösterimi
Kullanıcının gördüğü takvim:
- 🔴 Kırmızı/çizgili günler = Dolu (seçilemiyor)
- ⚪ Normal günler = Müsait (seçilebilir)
- 🟡 Sarı arka planlı günler = Özel fiyatlı (seçilebilir, fiyat değişir)
- Geçmiş tarihler gri ve seçilemez
- Kullanıcı giriş tarihi seçince → çıkış tarihini seç
- Seçim sonrası fiyat otomatik hesaplanır:
  - Her gün için `sezon_fiyatlari` tablosuna bak, varsa o fiyat, yoksa `ilanlar.gunluk_fiyat`
  - Toplam = Σ(her gün fiyatı) + temizlik ücreti
- "X gece × ortalama ₺Y = ₺Z + Temizlik ₺W = **Toplam ₺T**" göster

### 2.5 Rezervasyon → Otomatik doldur
Rezervasyon onaylandığında (`durum = 'onaylandi'`):
- O tarih aralığındaki günleri `musaitlik` tablosuna `durum: 'dolu'` olarak otomatik ekle
- Rezervasyon iptal edildiğinde (`durum = 'iptal'`) → o günleri `musaitlik`'ten sil

---

## BÖLÜM 3 — ADMIN PANELİ — TAM YENİDEN YAZ

Admin paneli `/yonetim` altında, `rol = 'admin'` kontrolü middleware'de yapılıyor.

### 3.1 Dashboard (/yonetim)
Üst istatistik kartları (Supabase'den gerçek veriler):
- 📋 Toplam İlan (aktif + pasif)
- ✅ Yayındaki İlanlar
- ⏳ Onay Bekleyen İlanlar (kırmızı badge, acil görünüm)
- 👥 Toplam Kullanıcı
- 📅 Bu Ayki Rezervasyon Sayısı
- 💰 Bu Ayki Toplam Gelir (₺)

Grafikler:
- Son 6 aylık rezervasyon sayısı (bar chart — recharts)
- Rezervasyon durum dağılımı (pie chart — recharts)

Hızlı işlem kartları:
- "Onay Bekleyen X İlan" → /yonetim/ilanlar?filtre=bekleyen
- "Bugün X Giriş Var" → check-in listesi
- "Bugün X Çıkış Var" → check-out listesi

### 3.2 İlan Yönetimi (/yonetim/ilanlar)
Tablo kolonları: Görsel | Başlık | Tür | Sahip | Fiyat | Durum | Tarih | İşlemler

Filtre tabları: Tümü | ⏳ Onay Bekleyen | ✅ Yayında | ❌ Reddedildi | 🚫 Pasif

Her ilan için işlem butonları:
- **Onayla** → `aktif = true` yap, sahibe email gönder
- **Reddet** → modal aç, red nedeni yaz, `aktif = false` bırak, sahibe email gönder
- **Düzenle** → tüm ilan bilgilerini düzenle
- **Takvimi Yönet** → /yonetim/ilanlar/[id]/takvim
- **Görüntüle** → ilan detay sayfasını yeni sekmede aç
- **Sil** → onay dialogu + sil

### 3.3 İlan Takvim Yönetimi (/yonetim/ilanlar/[id]/takvim)
(Bölüm 2.2'de detaylandırıldı)
Ek olarak:
- Sayfanın üstünde ilan adı, türü, günlük fiyatı göster
- Mevcut onaylı rezervasyonları takvimde mavi göster (tıklanınca rezervasyon detayı)
- "Tümünü Dolu Yap" (belirli ay için), "Tümünü Müsait Yap" toplu butonlar
- Değişiklikler anlık kaydedilsin (her tıklamada API çağrısı)

### 3.4 Paket Yönetimi (/yonetim/paketler)
Paketleri oluştur/düzenle/sil:
- Paket adı, kategori (macera/lüks/romantik/aile), açıklama
- Süre (gün), kapasite, fiyat
- İlan seçici: mevcut aktif ilanlardan çoklu seçim (checkbox list)
- Kapak görseli (Supabase Storage'a upload)
- Aktif/Pasif toggle
- "Kaydet" → `paketler` tablosuna yaz

### 3.5 Kullanıcı Yönetimi (/yonetim/kullanicilar)
Tablo: Ad Soyad | Email | Telefon | Rol | Kayıt Tarihi | Rezervasyon Sayısı | İşlemler
- Rol değiştir: ziyaretci ↔ ilan_sahibi ↔ admin (dropdown)
- Kullanıcı detayı: rezervasyonları, ilanları göster
- Email gönder butonu

### 3.6 Rezervasyon Yönetimi (/yonetim/rezervasyonlar)
Tablo: Ref No | Kullanıcı | İlan | Giriş | Çıkış | Misafir | Tutar | Durum | İşlemler
- Filtreler: durum, tarih aralığı, ilan türü
- Durum değiştir: beklemede → onaylandi / iptal
- Rezervasyon onaylandığında:
  - Takvimi otomatik doldur (Bölüm 2.5)
  - Kullanıcıya email gönder
- CSV/Excel export
- Bugünün giriş/çıkışları özel renkle vurgula

### 3.7 Ayarlar (/yonetim/ayarlar)
- TURSAB Belge No (düzenlenebilir, `ayarlar` tablosuna kaydet)
- WhatsApp numarası
- Komisyon oranı (%)
- Site adı / slogan
- İletişim bilgileri (footer'da kullanılacak)
- Email bildirimleri on/off
- "Kaydet" butonu

---

## BÖLÜM 4 — KAYIT & GİRİŞ AKIŞI

### 4.1 Kayıt sayfası (/kayit) — Tamamen yeniden yaz
Alanlar:
- Ad Soyad (zorunlu)
- E-posta (zorunlu)
- Telefon (zorunlu, format: 05XX XXX XX XX)
- Şifre (zorunlu, min 8 karakter, güç göstergesi)
- Şifre tekrarı (zorunlu)
- **Hesap türü** (zorunlu, büyük seçim kartları):
  - 🏖️ **Tatilci** — "Villa veya tekne kiralamak istiyorum" → rol: ziyaretci
  - 🏠 **İlan Sahibi** — "Villam veya teknem var, kiraya vermek istiyorum" → rol: ilan_sahibi
- Kullanım koşulları checkbox (zorunlu)

Kayıt sonrası:
- `kullanicilar` tablosuna `ad_soyad, telefon, rol` ile ekle
- `ziyaretci` → ana sayfaya yönlendir
- `ilan_sahibi` → `/panel/ilanlarim` sayfasına yönlendir

### 4.2 Giriş sonrası yönlendirme
- `ziyaretci` → ana sayfaya (veya `?redirect=` parametresindeki sayfaya)
- `ilan_sahibi` → `/panel/ilanlarim`
- `admin` → `/yonetim`

### 4.3 Header kullanıcı menüsü
Giriş yapılmışsa:
- Avatar (baş harf veya profil fotoğrafı) + kullanıcı adı dropdown
- `ziyaretci`: Rezervasyonlarım | Favorilerim | Profil | Çıkış
- `ilan_sahibi`: İlanlarım | Takvim Yönetimi | Gelen Talepler | Profil | Çıkış
- `admin`: Yönetim Paneli | Profil | Çıkış

---

## BÖLÜM 5 — İLAN SAHİBİ PANELİ

### 5.1 İlanlarım (/panel/ilanlarim)
- İlan kartları: görsel, başlık, tür, durum badge
  - "İnceleniyor" (sarı) — admin onayı bekleniyor
  - "Yayında" (yeşil) — aktif ve görünür
  - "Reddedildi" (kırmızı) — red nedeni tooltip ile göster
  - "Pasif" (gri) — ilan sahibi kapattı
- Her ilan için: Düzenle | Takvim | Fiyatlar | Önizle | Pasife Al
- "Yeni İlan Ekle" butonu (yeşil, belirgin)

### 5.2 İlan ekleme (/panel/ilanlarim/yeni) — 4 adım wizard

**Adım 1 — Temel Bilgiler:**
- İlan türü: büyük seçim kartları (🏠 Villa / ⛵ Tekne)
- Başlık (min 10 karakter)
- Açıklama (min 100 karakter, karakter sayacı)
- Konum dropdown: Ölüdeniz | Çalış | Göcek | Hisarönü | Kayaköy | Fethiye Merkez
- Açık adres
- Kapasite (kişi sayısı)
- Yatak odası sayısı
- Banyo sayısı
- Minimum kiralama süresi (gece): 1, 2, 3, 5, 7

**Adım 2 — Fotoğraflar:**
- Drag & drop upload alanı
- Minimum 3, maksimum 15 fotoğraf
- Supabase Storage'a yükle (`ilan-medyalari` bucket, `{ilan_id}/{timestamp}-{filename}`)
- Progress bar her fotoğraf için
- Yüklenen fotoğrafları sürükle-bırak ile sırala
- İlk fotoğraf otomatik kapak olur (taç ikonu ile işaretli)
- Fotoğraf sil butonu

**Adım 3 — Özellikler & Konum:**
Özellik checkboxları (ikonlu grid):
- 🏊 Havuz | 📶 WiFi | ❄️ Klima | 🌊 Deniz Manzarası
- 🌿 Bahçe | 🔥 BBQ/Mangal | 🚗 Otopark | 🧺 Çamaşır Makinesi
- 🍽️ Bulaşık Makinesi | 📺 Smart TV | ⚡ Jeneratör | ⚓ Tekne İskelesi
- 🛁 Jakuzi | 🧖 Sauna | 👶 Çocuk Dostu | 🐾 Evcil Hayvan İzinli

Harita üzerinde konum seçimi:
- Leaflet harita, Fethiye merkezinde başlar
- Kullanıcı haritaya tıklayarak pin koyar
- Koordinatlar `ilanlar.konum` alanına JSON olarak kaydet: `{lat, lng, adres}`

**Adım 4 — Fiyat & Kurallar:**
- Gecelik fiyat (₺)
- Temizlik ücreti (₺)
- Depozito (₺, opsiyonel)
- Giriş saati (dropdown: 14:00-20:00)
- Çıkış saati (dropdown: 08:00-12:00)
- Ev kuralları (textarea): sigara, evcil hayvan, parti/gürültü politikası
- İptal politikası: Esnek (24 saat) | Orta (7 gün) | Katı (14 gün)
- "İlanı Gönder" butonu

İlan gönderilince:
- `ilanlar` tablosuna `aktif: false` olarak kaydet
- Admin panelinde "Onay Bekleyen" listesine düşer
- İlan sahibine: "İlanınız incelemeye alındı, en geç 24 saat içinde dönüş yapılacaktır."

### 5.3 Takvim Yönetimi (/panel/takvim)
İlan sahibi kendi ilanlarının takvimini yönetir:
- İlan seçici dropdown (birden fazla ilanı varsa)
- Renk kodlu takvim (Bölüm 2.2 ile aynı mantık)
- Dolu işaretle / Müsait yap
- Sezon fiyatı ekle/sil
- Onaylı rezervasyonlar sadece görüntülenir, değiştirilemez

---

## BÖLÜM 6 — GÖRSEL ZENGİNLEŞTİRME

### 6.1 Ana Sayfa (/) — Komple yeniden tasarım

**Hero Section:**
- Tam ekran (100vh) arka plan: Fethiye/Ölüdeniz fotoğrafı + koyu gradient overlay
- Animasyonlu başlık (aşağıdan yukarı fade-in):
  - "Fethiye'de Hayalinizdeki Tatili Yaşayın"
  - Alt başlık: "Lüks villalar ve özel teknelerle unutulmaz deneyimler"
- Arama formu (beyaz kart, gölgeli, ortada):
  - 📅 Giriş Tarihi | 📅 Çıkış Tarihi | 👥 Misafir Sayısı | 🔍 Ara
  - Misafir sayısı: +/- butonlarıyla artır/azalt
  - "Ara" tıklanınca `/konaklama?giris=&cikis=&misafir=` ile yönlendir
- Hero alt kısmında güven istatistikleri (counter animasyonlu):
  - ✅ 500+ Mutlu Misafir | 🏠 50+ Onaylı Villa | ⛵ 20+ Tekne | ⭐ %98 Memnuniyet

**Neden SezondalKirala? Section:**
- Mavi arka plan (#0EA5E9)
- 4 kart (beyaz ikonlar):
  - 🔒 Güvenli Ödeme — "SSL şifreli, iyzico güvenceli"
  - ✅ Onaylı İlanlar — "Tüm ilanlar admin tarafından onaylanır"
  - 📞 7/24 Destek — "WhatsApp ve telefon ile ulaşabilirsiniz"
  - 🏆 TURSAB Üyesi — "Belge No: 14382 ile güvence altında"

**Öne Çıkan Paketler:**
- Başlık + kategori filtre tabları (Tümü/Macera/Lüks/Romantik/Aile)
- Paket kartları: büyük görsel, gradient overlay üzerine beyaz metin, kategori badge, fiyat, süre
- Hover: kart yukarı kayar + gölge büyür
- "Tüm Paketleri Gör" butonu

**Öne Çıkan Villalar:**
- 3 kolon grid (masaüstü), 2 (tablet), 1 (mobil)
- Kart: görsel (aspect 4/3, hover'da zoom), lokasyon, başlık, özellikler, fiyat, buton
- Sponsorlu ilanlar "⭐ Öne Çıkan" badge ile
- Kalp ikonu: favoriye ekle (giriş yapılıysa Supabase'e, yoksa localStorage)
- "Tüm Villaları Gör" butonu

**Nasıl Çalışır? Section:**
- 3 adım, numaralı büyük daireler:
  1. "Tarih & Konum Seç" — arama formunu kullan
  2. "İlanı İncele" — fotoğraflar, takvim, fiyat hesapla
  3. "Güvenle Rezervasyon Yap" — online ödeme, TURSAB güvencesi
- Her adım arasında ok animasyonu

**Müşteri Yorumları Section:**
- 3 yorum kartı (yorumlar tablosundan en yüksek puanlılar)
- Yıldız gösterimi, kullanıcı adı, ilan adı, tarih
- Arka plan: açık gri

**Footer:** (Bölüm 1.2'de tanımlandı)

### 6.2 Konaklama & Tekneler Sayfaları

**Filtre Sidebar:**
- Fiyat aralığı: min-max slider (₺500 - ₺20.000)
- Kapasite: 2 kişi | 4 kişi | 6 kişi | 8+ kişi (toggle butonlar)
- Yatak odası: 1+ | 2+ | 3+ | 4+
- Konum: checkbox listesi (Ölüdeniz, Çalış, Göcek, Hisarönü, Kayaköy, Fethiye Merkez)
- Özellikler: checkbox (Havuz, WiFi, Klima, Deniz Manzarası, Jakuzi, Evcil Hayvan)
- Müsaitlik: tarih aralığı seçici (seçilirse müsait olmayanları gizle)
- "Filtreleri Uygula" ve "Temizle" butonları
- Mobilde: "Filtrele" butonu → drawer olarak alttan açılır

**Sıralama:**
- "Önerilen" | "Fiyat ↑" | "Fiyat ↓" | "En Yeni" | "En Çok Yorumlanan"

**İlan Kartları:**
- Görsel (hover'da %105 zoom, 0.3s transition)
- Üst sol: Lokasyon badge | Üst sağ: Kalp (favori) ikonu
- Sponsorlu: "⭐ Öne Çıkan" badge (mavi)
- Başlık (2 satır max, overflow: ellipsis)
- Özellik ikonları: 🛏️X · 🚿X · 👥X
- Alt: Fiyat (büyük, bold) + "Detayı Gör" butonu

### 6.3 İlan Detay Sayfası

**Fotoğraf Galerisi:**
- Ana görsel sol (2/3 genişlik)
- Sağda 2 küçük görsel dikey (4+ varsa son görselde "+X fotoğraf" overlay)
- Tıklanınca lightbox (keyboard navigation, swipe mobile)

**İki kolon layout:**
Sol (2/3):
- Başlık, lokasyon, puan + yorum sayısı
- Özellikler (ikonlu grid): kapasite, yatak, banyo, vb.
- Açıklama metni (tümünü göster/gizle)
- Özellik listesi (havuz, wifi vb. ikonlarla, 2 kolon)
- Ev kuralları bölümü
- Giriş/Çıkış saatleri
- İptal politikası
- Konum haritası (Leaflet)
- Yorumlar (puan ortalaması + dağılımı + liste)
- Benzer ilanlar

Sağ (1/3, sticky):
- Fiyat kartı (beyaz, gölgeli, sticky top-24)
- "₺X.XXX / gece"
- Tarih seçici (giriş + çıkış, takvimde dolu günler kırmızı)
- Misafir sayısı (+/-)
- Fiyat hesaplama özeti:
  ```
  ₺4.500 × 7 gece = ₺31.500
  Temizlik ücreti:   ₺500
  ─────────────────────────
  Toplam:           ₺32.000
  ```
- "Rezervasyon Yap" butonu (mavi, büyük)
  - Giriş yapılmamışsa: `/giris?redirect=/konaklama/[id]`
- "WhatsApp ile Sor" butonu (yeşil)

**Mobil sticky bar:**
- Sayfa altında sabit: "₺X.XXX/gece · Rezervasyon Yap · WhatsApp"
- Fotoğraf galerisi swipe destekli

### 6.4 Hakkımızda (/hakkimizda)
- Hero: büyük Fethiye görseli + gradient + başlık
- Hikayemiz (2 paragraf metin + yan görsel)
- Rakamlar: 500+ Misafir | 50+ Villa | 7 Yıl Deneyim | %98 Memnuniyet (animasyonlu sayaç)
- TURSAB güven bölümü: büyük TURSAB logosu placeholder + "Belge No: 14382" + açıklama
- Ekibimiz: 3-4 kişi kartı (isim, unvan, fotoğraf placeholder)
- İletişim CTA: "Sorularınız için bize ulaşın" + WhatsApp butonu

### 6.5 SSS (/sss)
Accordion ile en az 12 soru:
1. Rezervasyon nasıl yapılır?
2. Ödeme yöntemleri nelerdir?
3. İptal politikası nedir?
4. Giriş-çıkış saatleri nedir?
5. Depozito alınıyor mu?
6. Villa sahibi nasıl ilan ekler?
7. İlanlar nasıl onaylanır?
8. TURSAB güvencesi ne anlama gelir?
9. Takvimde dolu günler nasıl belirlenir?
10. Sezon fiyatları nedir?
11. WhatsApp üzerinden rezervasyon yapılır mı?
12. Sorun yaşarsam ne yapmalıyım?

---

## BÖLÜM 7 — REZERVASYON AKIŞI İYİLEŞTİRME

### 7.1 Giriş zorunluluğu
"Rezervasyon Yap"a tıklandığında giriş yapılmamışsa:
- `/giris?redirect=/konaklama/[id]?giris=X&cikis=Y&misafir=Z` yönlendir
- Giriş sonrası seçilen tarihler ve misafir sayısıyla rezervasyon sayfasına dön

### 7.2 Rezervasyon wizard (/rezervasyon/[id])
**Adım 1 — Özet:**
- İlan görseli + adı + konumu
- Tarih ve misafir sayısı (önceden seçilmişse dolu gelir, değiştirilebilir)
- Fiyat breakdown:
  ```
  7 gece × ₺4.500 (normal fiyat)    = ₺31.500
  2 gece × ₺6.000 (yüksek sezon)    = ₺12.000
  Temizlik ücreti                    = ₺500
  ──────────────────────────────────────────
  Toplam                             = ₺44.000
  ```
- Sezon fiyatları varsa her gün ayrı hesaplanır

**Adım 2 — Kişisel Bilgiler:**
- Ad, Soyad, E-posta, Telefon (zorunlu)
- Özel istek / not (opsiyonel, textarea)
- Kaç kişiyle geliniyor (detay: yetişkin + çocuk)

**Adım 3 — Ödeme:**
- Ödeme yöntemi: 💳 Kredi/Banka Kartı | 🏦 Havale
- Kredi kartı: iyzico placeholder UI (kart numarası, ad, tarih, CVV)
- Havale: IBAN ve hesap adı göster
- "Güvenli Ödeme" rozeti + SSL ikonu

**Adım 4 — Onay:**
- Büyük yeşil tik animasyonu
- Referans numarası: `SZK-{YYYYMMDD}-{random4}` (örn: SZK-20260715-4823)
- Rezervasyon özeti (ilan, tarihler, tutar)
- TURSAB badge
- "Rezervasyonlarıma Git" butonu
- Email gönderildiğine dair bilgi

---

## BÖLÜM 8 — ANİMASYONLAR & UX

Framer Motion veya Tailwind animasyonları kullan:
- Sayfa geçişleri: fade-in (opacity 0→1, translateY 10px→0, 300ms)
- Kart hover: translateY(-4px) + box-shadow (tüm kartlarda)
- Hero başlık: staggered fade-in (başlık → alt başlık → form → istatistikler)
- Sayaçlar (istatistik rakamları): görünüme girince 0'dan hedefe animasyonlu artış (Intersection Observer)
- Skeleton loading: shimmer animasyonu (veri yüklenirken)
- Buton hover: brightness artışı + scale(1.02), 150ms
- Toast bildirimleri: sağ üstten kayarak gelir
- Takvim günleri: hover'da yumuşak renk geçişi
- Fotoğraf galerisi: fade transition

---

## BÖLÜM 9 — MOBİL

- Header: hamburger menü (≤768px), overlay backdrop, X ile kapat
- Arama formu: dikey stack (mobilde 4 satır)
- Filtre sidebar: drawer (alttan kayar, react-spring veya CSS transition)
- İlan detay: sticky alt bar "₺X.XXX/gece | [Rezervasyon Yap] [WhatsApp]"
- WhatsApp butonu: `fixed bottom-20 right-4 z-50` — büyük yeşil daire
- Fotoğraf galerisi: swipe (touch events)
- Takvim: tam genişlik, büyük dokunma hedefleri
- Tüm buton/link min-height: 44px

---

## BÖLÜM 10 — SEO & PERFORMANS

Her sayfaya `generateMetadata`:
- `/`: "Fethiye Villa ve Tekne Kiralama | SezondalKirala — TURSAB Onaylı"
- `/konaklama`: "Fethiye Villa Kiralama — Özel Havuzlu Lüks Villalar"
- `/tekneler`: "Fethiye Tekne Kiralama — Gület ve Sürat Teknesi"
- `/paketler`: "Fethiye Tatil Paketleri — Macera, Lüks, Romantik, Aile"
- İlan detay: `${ilan.baslik} — Fethiye Kiralama | SezondalKirala`
- og:image, og:description, twitter:card ekle

JSON-LD schema (ana sayfa + ilan detayları):
```json
{
  "@type": "LodgingBusiness",
  "name": "SezondalKirala",
  "description": "...",
  "address": { "@type": "PostalAddress", "addressLocality": "Fethiye" }
}
```

SEO sayfaları:
- `/fethiye/villa-kiralama`: statik, 500+ kelime içerik, H1-H2-H3 yapısı, FAQ schema
- `/fethiye/tekne-kiralama`: aynı yapı

---

## BÖLÜM 11 — GENEL KALİTE

- 404 sayfası (not-found.tsx): Türkçe mesaj, ana sayfaya dön butonu, mini navigasyon
- Error boundary: hata durumunda güzel Türkçe hata sayfası
- Loading skeletonlar: her data-fetching bileşende
- Boş durumlar: "Henüz ilan yok", "Rezervasyon bulunamadı" — güzel illüstrasyon + mesaj
- Tüm form hata mesajları Türkçe (zod şemaları)
- `console.log` ve debug kodlarını temizle
- TypeScript hataları sıfıra indir

---

## SONUNDA

```bash
npm run build
npm run lint
```

Her ikisi de hatasız geçmeli. Hata varsa düzelt, sonra tamamlandığını söyle.
