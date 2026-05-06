# SezondalKirala — Kapsamlı Geliştirme Promptu

Aşağıdaki tüm geliştirmeleri sırayla yap. Her maddeyi tamamladıktan sonra bir sonrakine geç. Sonunda `npm run build` ile doğrula.

---

## 1. KRİTİK BUGLAR (Önce bunları düzelt)

### 1.1 Ana sayfada slug undefined sorunu
- Ana sayfadaki ilan kartları `/konaklama/undefined` ve `/tekneler/undefined` gidiyor
- Sorgu `ilanlar` tablosundan `id` alanını da çekiyor mu kontrol et
- Link: `href={/konaklama/${ilan.slug ?? ilan.id}}`

### 1.2 Türkçe karakter sorunu
- Ana sayfa ve bazı sayfalarda ş,ğ,ü,ı,ö,ç bozuk görünüyor
- `layout.tsx`'te `<html lang="tr">` ve `<meta charset="utf-8">` olduğundan emin ol
- Tüm hardcoded Türkçe metinleri UTF-8 uyumlu yaz

### 1.3 WhatsApp numarası
- İlan detay sayfasında WhatsApp butonu `905XXXXXXXXX` placeholder gösteriyor
- `lib/constants.ts`'te `WHATSAPP_NUMBER` sabitini gerçek bir numara formatına çevir: `905XXXXXXXXX` (şimdilik bu şekilde kalsın ama en azından görünür olsun)

---

## 2. KAYIT AKIŞI — ROL SEÇİMİ

### 2.1 Kayıt sayfasını (/kayit) tamamen yeniden yaz
Mevcut kayıt formu çok basit. Şu alanları ekle:
- Ad Soyad (zorunlu)
- E-posta (zorunlu)
- Telefon (zorunlu, Türk formatı: 05XX XXX XX XX)
- Şifre (zorunlu, min 8 karakter)
- Şifre Tekrarı (zorunlu)
- **Hesap Türü seçimi (zorunlu, büyük ve belirgin olmalı):**
  - 🏖️ **Tatilci** — "Villa veya tekne kiralamak istiyorum" (rol: ziyaretci)
  - 🏠 **İlan Sahibi** — "Kendi villam veya teknem var, kiraya vermek istiyorum" (rol: ilan_sahibi)
- Kullanım koşullarını kabul ediyorum checkbox (zorunlu)

Kayıt olunca `kullanicilar` tablosuna seçilen rol ile kaydet.

### 2.2 Giriş sonrası yönlendirme
- `ziyaretci` rolü → ana sayfaya yönlendir
- `ilan_sahibi` rolü → `/panel/ilanlarim` sayfasına yönlendir
- `admin` rolü → `/yonetim` sayfasına yönlendir

### 2.3 Header'da kullanıcı menüsü
Giriş yapıldığında header'da "Giriş / Kayıt Ol" butonları yerine:
- Kullanıcı avatarı (varsa) veya baş harfi
- Dropdown menü:
  - `ziyaretci` için: Rezervasyonlarım, Favorilerim, Profil, Çıkış
  - `ilan_sahibi` için: İlanlarım, Takvim, Talepler, Profil, Çıkış
  - `admin` için: Yönetim Paneli, Profil, Çıkış

---

## 3. GÖRSEL ZENGİNLEŞTİRME — TÜM SAYFALAR

### 3.1 Ana Sayfa (/) — Tamamen yeniden tasarla
**Hero Section:**
- Tam ekran arka plan: Fethiye/Ölüdeniz görselini kullanan gradient overlay ile birlikte
- Büyük başlık: "Fethiye'de Hayalinizdeki Tatili Yaşayın"
- Alt başlık: "Lüks villalar ve özel teknelerle unutulmaz bir deneyim"
- Arama formu: tarih seçici + misafir sayısı + "Ara" butonu — beyaz kart içinde, gölgeli
- Arama formu altında güven istatistikleri: "500+ Mutlu Misafir | 50+ Villa | 20+ Tekne | %98 Memnuniyet"

**Neden Biz Section:**
- 4 kart yan yana: 🔒 Güvenli Ödeme | ✅ Onaylı İlanlar | 📞 7/24 Destek | 🏆 TURSAB Üyesi
- Mavi arka plan (#0EA5E9) üzerine beyaz ikonlar ve metinler

**Öne Çıkan Paketler:**
- Kategori filtreleri (Tümü/Macera/Lüks/Romantik/Aile) — aktif kategori mavi
- Paket kartları: görsel, kategori badge, başlık, açıklama, süre, kapasite, fiyat, "İncele" butonu
- Kartlarda hover animasyonu (yukarı kayma + gölge)

**Öne Çıkan Villalar:**
- Grid: 3 kolon (masaüstü), 2 kolon (tablet), 1 kolon (mobil)
- Her kart: görsel (aspect-ratio 4/3), lokasyon badge, başlık, özellikler (yatak/banyo/kapasite), fiyat, "Detayı Gör" butonu
- Kalp ikonu ile favoriye ekleme (giriş yapılıysa)
- Sponsorlu ilanlar üst sırada, "Öne Çıkan" badge ile

**Nasıl Çalışır Section:**
- 3 adım: "Ara & Seç" → "Rezervasyon Yap" → "Tatilini Yaşa"
- Büyük numaralar, ikonlar ve açıklamalar

**Müşteri Yorumları Section:**
- 3 yorum kartı (yorumlar tablosundan en yüksek puanlılar)
- 5 yıldız gösterimi, kullanıcı adı, ilan adı

**Footer:**
- 4 kolon: Logo+açıklama | Hızlı Linkler | İletişim | Sosyal Medya
- TURSAB badge belirgin şekilde
- Koyu arka plan (#1e293b)

### 3.2 Konaklama ve Tekneler Sayfaları
**Filtre Sidebar'ı geliştir:**
- Fiyat aralığı slider (min-max)
- Kapasite seçimi (1-2, 3-4, 5-6, 7+ kişi)
- Yatak odası sayısı
- Özellikler: Havuz ✓, WiFi ✓, Klima ✓, Deniz manzarası ✓, Bahçe ✓, BBQ ✓
- Konum filtresi (Ölüdeniz, Çalış, Göcek, Hisarönü, Kayaköy, Fethiye Merkez)
- "Filtreleri Temizle" butonu

**İlan kartları:**
- Görsel büyük ve net (aspect-ratio 3/2)
- Hover'da görsel hafif zoom
- Üstte: lokasyon badge + favori kalp ikonu
- Ortada: başlık, kısa açıklama (2 satır max)
- Altta: özellik ikonları (yatak, banyo, kapasite) + fiyat + "Detayı Gör" butonu
- Sponsorlu kartlarda "⭐ Öne Çıkan" badge

**Sıralama:**
- Dropdown: "Önerilen", "Fiyat (Artan)", "Fiyat (Azalan)", "En Yeni"

### 3.3 İlan Detay Sayfası (/konaklama/[id] ve /tekneler/[id])
**Fotoğraf Galerisi:**
- Ana görsel büyük (sol 2/3)
- Sağda 2 küçük görsel üst üste (4'ten fazlaysa "+X daha" overlay)
- Tıklanınca lightbox (tam ekran galeri)

**Başlık alanı:**
- İlan adı (büyük)
- Lokasyon (harita ikonu ile)
- Puan + yorum sayısı
- Paylaş butonu

**İçerik (2 kolon):**
Sol (2/3 genişlik):
- Özellikler: 🛏️ X Yatak Odası | 🚿 X Banyo | 👥 X Kişi
- Ayırıcı çizgi
- Açıklama metni (tam)
- Özellikler listesi (havuz, wifi vb. ikonlarla)
- Konum haritası (Leaflet)
- Yorumlar (puan dağılımı + yorum listesi)
- Benzer ilanlar

Sağ (1/3 genişlik — sticky):
- Fiyat kartı: "₺X.XXX / gece"
- Tarih seçici (giriş-çıkış)
- Misafir sayısı seçici
- Fiyat hesaplama özeti
- **"Rezervasyon Yap" butonu** → giriş yapılmamışsa `/giris?redirect=/konaklama/[id]`'ye yönlendir
- **"WhatsApp ile Sor" butonu** (yeşil)

**Mobilde:**
- Fiyat kartı sayfa altında sticky bar olarak: "₺X.XXX/gece | Rezervasyon Yap"

### 3.4 Paketler Sayfası
- Paket kartları büyük ve görsel içermeli
- Her pakette: kategori badge, başlık, açıklama, süre (X gün), kapasite, dahil olan ilanlar listesi, fiyat, "Paketi İncele" butonu
- Pakete tıklanınca detay modal veya sayfa açılsın
- Kategori filtreleri büyük ve tıklanabilir

### 3.5 Hakkımızda Sayfası — Tamamen yeniden yaz
- Hero: büyük başlık + Fethiye görseli
- Hikayemiz bölümü (2 paragraf)
- Rakamlarla biz: 500+ Misafir | 50+ Villa | 7 Yıl Deneyim | %98 Memnuniyet
- Neden biz: 4 kart (Güven, Kalite, Destek, Fiyat)
- TURSAB güven bölümü: büyük badge + açıklama
- İletişim bilgileri

### 3.6 SSS Sayfası
En az 10 soru-cevap ekle (accordion):
- Rezervasyon nasıl yapılır?
- Ödeme yöntemleri nelerdir?
- İptal politikası nedir?
- Villa sahibi nasıl ilan ekler?
- TURSAB güvencesi ne anlama gelir?
- vb.

---

## 4. İLAN SAHİBİ AKIŞI

### 4.1 İlan Ekleme — /panel/ilanlarim/yeni
4 adımlı wizard tamamen yeniden yaz, tüm alanlar zorunlu:

**Adım 1 — Temel Bilgiler:**
- İlan türü: Villa mi Tekne mi? (büyük seçim kartları)
- Başlık (zorunlu, min 10 karakter)
- Açıklama (zorunlu, min 100 karakter, karakter sayacı ile)
- Konum: dropdown (Ölüdeniz, Çalış, Göcek, Hisarönü, Kayaköy, Fethiye Merkez)
- Açık adres (zorunlu)
- Kapasite / Yatak Odası / Banyo sayıları (number input)

**Adım 2 — Fotoğraflar:**
- Drag & drop alan
- Min 3, max 15 fotoğraf zorunlu
- Fotoğraflar Supabase Storage'a yüklenir
- Yükleme progress bar
- Sıralama (drag & drop ile)
- İlk fotoğraf "kapak" olarak işaretlenir

**Adım 3 — Özellikler & Konum:**
- Özellik checkboxları (her biri ikonlu):
  - Havuz, WiFi, Klima, Deniz manzarası, Bahçe, BBQ, Otopark, Çamaşır makinesi, Bulaşık makinesi, TV, Jeneratör, Tekne iskelesi
- Harita üzerinde konum seçimi (Leaflet — kullanıcı pin koyar, koordinatlar kaydedilir)
- Kurallara uymayan içerik yayınlamama onayı checkbox

**Adım 4 — Fiyat:**
- Gecelik fiyat (₺, zorunlu)
- Temizlik ücreti (₺, zorunlu)
- Min kiralama süresi (gece)
- Sezon fiyatları (opsiyonel — tarih aralığı + fiyat eklenebilir)
- "İlanı Gönder" butonu

İlan gönderildikten sonra:
- `ilanlar` tablosuna `aktif: false` olarak kaydet
- Admin'e bildirim (email veya panel notification)
- Kullanıcıya başarı mesajı: "İlanınız inceleme için gönderildi. Admin onayının ardından yayınlanacaktır."

### 4.2 Panel Ana Sayfası — /panel/ilanlarim
- İlanlar listesi: görsel, başlık, durum badge (Yayında/İnceleniyor/Reddedildi)
- İnceleniyor olanlar sarı badge, Yayında yeşil, Reddedildi kırmızı
- Her ilan için: Düzenle | Takvimi Yönet | Fiyatları Yönet | Önizle butonları
- "Yeni İlan Ekle" butonu belirgin

---

## 5. ADMIN PANELİ — /yonetim

### 5.1 Dashboard
- İstatistik kartları: Toplam İlan | Aktif İlan | Bekleyen Onay | Toplam Kullanıcı | Bu Ayki Rezervasyon | Bu Ayki Gelir
- Son 5 rezervasyon tablosu
- **Onay Bekleyen İlanlar** bölümü (en üstte, kırmızı badge ile)

### 5.2 İlan Onay Sayfası — /yonetim/ilanlar
- Tüm ilanlar tablosu: başlık, sahip, tür, oluşturma tarihi, durum
- Filtre: Bekleyen Onay | Yayında | Reddedildi
- Bekleyen ilanlar için: "Onayla" (yeşil) ve "Reddet" (kırmızı) butonları
- Onaylandığında: `ilanlar.aktif = true` yapılır, sahibe email gönderilir
- Reddedildiğinde: red nedeni yazılır, sahibe email gönderilir

### 5.3 Kullanıcı Yönetimi — /yonetim/kullanicilar
- Tüm kullanıcılar tablosu: ad, email, rol, kayıt tarihi, rezervasyon sayısı
- Rol değiştirme dropdown
- Kullanıcıyı deaktif etme

### 5.4 Rezervasyon Yönetimi — /yonetim/rezervasyonlar
- Tüm rezervasyonlar: kullanıcı, ilan, tarihler, tutar, durum
- Durum filtreleri
- CSV export butonu

---

## 6. REZERVASYON AKIŞI İYİLEŞTİRMELERİ

### 6.1 Giriş zorunluluğu
- Kullanıcı "Rezervasyon Yap"a tıkladığında giriş yapmamışsa:
  - `/giris?redirect=/konaklama/[id]` sayfasına yönlendir
  - Giriş sonrası otomatik rezervasyon sayfasına dön

### 6.2 Rezervasyon wizard'ı (/rezervasyon/[id])
- Adım 1'de fiyat hesaplama net gösterilmeli: X gece × ₺Y = ₺Z + Temizlik ₺W = **Toplam ₺T**
- Adım 2'de form alanları: Ad, Soyad, Telefon, E-posta, Özel İstek (opsiyonel)
- Adım 3'te kart formu placeholder olarak göster (iyzico entegrasyonu hazır değil, UI olsun)
- Adım 4'te: büyük yeşil tik, referans numarası (SZK-XXXXXX), rezervasyon özeti, "Ana Sayfaya Dön" butonu

---

## 7. ANİMASYONLAR

Framer Motion veya Tailwind CSS animasyonları kullan:

- **Sayfa geçişleri**: sayfalar arası fade-in animasyonu
- **Kart hover**: `transform: translateY(-4px)` + `box-shadow` geçişi (tüm kartlarda)
- **Hero**: başlık ve arama formu aşağıdan yukarı fade-in
- **İstatistik sayaçları**: görünüme girince sayılar 0'dan değere animasyonlu artış
- **Buton hover**: renk geçişi smooth olmalı (transition: all 0.2s)
- **Skeleton loading**: veri yüklenirken shimmer animasyonu
- **Toast bildirimleri**: sağ üstten kayarak gelen bildirimler

---

## 8. MOBİL İYİLEŞTİRMELER

- Header: mobilde hamburger menü (X ile kapanır, overlay ile)
- Ana sayfa: arama formu mobilde dikey düzende
- Konaklama/Tekneler: mobilde filtre sidebar drawer olarak açılır (alt kısımdan kayar)
- İlan detay: sticky alt bar "₺X.XXX/gece | Rezervasyon Yap | WhatsApp"
- WhatsApp butonu: mobilde sağ alt köşede sabit, büyük ve belirgin
- Footer: mobilde tek kolon
- Tüm touch target'lar min 44px yüksekliğinde

---

## 9. SEO İYİLEŞTİRMELERİ

Her sayfaya `generateMetadata` ekle:
- `/`: "Fethiye Villa ve Tekne Kiralama | SezondalKirala"
- `/konaklama`: "Fethiye Villa Kiralama — Lüks Tatil Villaları"
- `/tekneler`: "Fethiye Tekne Kiralama — Özel Gulet ve Sürat Teknesi"
- `/paketler`: "Fethiye Tatil Paketleri — Macera, Lüks, Romantik"
- `/konaklama/[id]`: ilan başlığı + "| SezondalKirala"

JSON-LD schema markup ekle (ana sayfa ve ilan detaylarına).

---

## 10. GENEL KALİTE

- 404 sayfası (not-found.tsx): "Sayfa bulunamadı" + ana sayfaya dön butonu
- Loading skeleton'lar: veri gelene kadar shimmer göster
- Error boundary: hata durumunda kullanıcıya Türkçe mesaj
- Tüm formlar: react-hook-form + zod validasyon, Türkçe hata mesajları
- Boş durumlar: ilan yoksa, yorum yoksa, rezervasyon yoksa güzel "boş durum" görseli

---

## SONUNDA
`npm run build` çalıştır, hata yoksa tamamdır. Hata varsa düzelt.
