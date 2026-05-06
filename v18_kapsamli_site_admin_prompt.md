# SezondalKirala — V18 Kapsamlı Site & Admin Panel Geliştirme

Tüm sayfalar detaylı incelendi. Aşağıdaki tüm değişiklikleri sırayla uygula.

---

## BÖLÜM 1 — KRİTİK BUGLAR

### 1.1 TURSAB numarası tutarsız
Hakkımızda ve footer'da "5141" yazıyor, SSS'de "14382" yazıyor.
`lib/constants.ts` içindeki `TURSAB_NO = "14382"` sabitini tüm sayfalarda kullan.
Hardcoded "5141" olan yerleri bul ve `TURSAB_NO` ile değiştir.

### 1.2 Paket sekmeleri sayfanın başına atıyor
Ana sayfada Tümü/Macera/Lüks sekmeleri `href="/"` veya `href="/?kategori=macera"` — sayfa başına gidiyor.
`PaketFiltreler` Client Component yap, `onClick` ile state değiştir, Link kullanma.

### 1.3 İletişim formu e-posta açıyor
`/iletisim` sayfasındaki form submit'te e-posta istemcisi açılıyor.
Server Action ile Resend API üzerinden gerçek e-posta gönder:
```tsx
// app/iletisim/actions.ts
'use server'
export async function mesajGonder(formData: FormData) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: 'info@sezondakirala.com',
    subject: `İletişim Formu — ${formData.get('ad')}`,
    text: `Ad: ${formData.get('ad')}\nMesaj: ${formData.get('mesaj')}`,
  })
  return { basarili: true }
}
```

### 1.4 İlan detay açıklamalarında Türkçe karakter bozuk
"laguunune sifir", "essiz", "luks", "kisiye" gibi bozuk metinler var.
Tüm hardcoded Türkçe metin içeren dosyaları tara ve düzelt.

### 1.5 İlan detay fiyat kartı — tarih seçmeden rezervasyon yapılabiliyor
Tarih seçilmemişse "Rezervasyon Yap" butonu disabled olmalı,
tıklanınca tarih seçiciye scroll etmeli (önceki promptta tanımlandı, uygulandı mı kontrol et).

---

## BÖLÜM 2 — ANA SAYFA EKSİKLERİ

### 2.1 İstatistik sayaçları "0+" gösteriyor
```tsx
// app/page.tsx — Supabase'den gerçek veri çek
const [
  { count: villaSayisi },
  { count: tekneSayisi },
  { count: rezervasyonSayisi },
  { data: yorumlar },
] = await Promise.all([
  supabase.from('ilanlar').select('*', { count: 'exact', head: true }).eq('aktif', true).eq('tip', 'villa'),
  supabase.from('ilanlar').select('*', { count: 'exact', head: true }).eq('aktif', true).eq('tip', 'tekne'),
  supabase.from('rezervasyonlar').select('*', { count: 'exact', head: true }).eq('durum', 'onaylandi'),
  supabase.from('yorumlar').select('puan'),
])

const ortPuan = yorumlar?.length
  ? (yorumlar.reduce((sum, y) => sum + y.puan, 0) / yorumlar.length).toFixed(1)
  : '5.0'

// Gösterim:
// "😊 {rezervasyonSayisi}+ Mutlu Misafir"
// "🏠 {villaSayisi}+ Onaylı Villa"
// "⛵ {tekneSayisi}+ Özel Tekne"
// "⭐ {ortPuan} Ortalama Puan"
```

### 2.2 Yorum kartlarında "Misafir" yazıyor
```tsx
const { data: yorumlar } = await supabase
  .from('yorumlar')
  .select('*, kullanicilar(ad_soyad), ilanlar(baslik)')
  .gte('puan', 4)
  .order('olusturulma_tarihi', { ascending: false })
  .limit(6)
// Gösterim: yorum.kullanicilar?.ad_soyad ?? 'Misafir'
```

### 2.3 Hero arama formu içinde değil, altında duruyor
Hero section `min-height: 85vh` olmalı, arama formu video üzerinde içeride olmalı.
Header scroll'da transparan → beyaz geçiş yapmalı.

### 2.4 Paket kartları tıklanmıyor / yanlış sayfaya gidiyor
Her paket kartı `href="/paketler/${paket.id}"` olmalı.

---

## BÖLÜM 3 — İLAN DETAY SAYFASI EKSİKLERİ

### 3.1 Takvim fiyatları birikim yapıyor
Her günün fiyatı o günün gecelik fiyatı olmalı, birikim değil.
Custom day renderer'da `totalPrice +=` mantığı varsa kaldır.

### 3.2 Galeri sol/sağ ok butonları
Ana görselde sol/sağ ok butonu olmalı, tüm fotoğraflarda gezinti yapılabilmeli.

### 3.3 Harita gösterimi
İlan detayında Leaflet harita var mı kontrol et. Yoksa ekle:
```tsx
// dynamic import ile SSR'sız yükle
const IlanHarita = dynamic(() => import('@/components/IlanHarita'), { ssr: false })
// İlan konumuna göre center yap
```

### 3.4 Benzer ilanlar eksik
```tsx
const { data: benzerIlanlar } = await supabase
  .from('ilanlar')
  .select('*, ilan_medyalari(url, sira)')
  .eq('aktif', true)
  .eq('tip', ilan.tip)
  .eq('konum', ilan.konum)
  .neq('id', ilan.id)
  .limit(3)
```

---

## BÖLÜM 4 — SSS SAYFASI İYİLEŞTİRME

### 4.1 Tasarım çok sade
```tsx
// Hero bölümü ekle:
<div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }} className="py-16 text-center">
  <h1 className="text-4xl font-bold text-gray-900 mb-3">Sıkça Sorulan Sorular</h1>
  <p className="text-gray-600">Aklınızdaki her sorunun cevabı burada</p>
</div>

// Accordion tasarımı — aktif olanda mavi border, açık mavi arka plan
// Her soru için soru işareti ikonu
```

### 4.2 Cevaplar çok kısa, detaylandır
Her cevabı en az 2-3 cümle olacak şekilde genişlet.

---

## BÖLÜM 5 — İLETİŞİM SAYFASI İYİLEŞTİRME

### 5.1 Mevcut durum çok basit
```tsx
// İki kolonlu layout:
// Sol: iletişim bilgileri + harita
// Sağ: iletişim formu

// İletişim kartları (ikonlu):
<div className="grid grid-cols-2 gap-4 mb-6">
  <IletisimKarti ikon={Phone} baslik="Telefon" deger="+90 532 425 10 00" href="tel:+905324251000" />
  <IletisimKarti ikon={MessageCircle} baslik="WhatsApp" deger="Mesaj Gönder" href="https://wa.me/905324251000" />
  <IletisimKarti ikon={Mail} baslik="E-posta" deger="info@sezondakirala.com" href="mailto:info@sezondakirala.com" />
  <IletisimKarti ikon={Clock} baslik="Çalışma Saatleri" deger="Pzt-Cmt 09:00-18:00" />
</div>

// Form — Server Action ile Resend gönderimi
// Ad Soyad, E-posta, Telefon, Konu (dropdown), Mesaj
// Gönder → "Mesajınız alındı, en kısa sürede dönüş yapacağız" toast
```

---

## BÖLÜM 6 — HAKKIMIZDA SAYFASI

### 6.1 TURSAB numarası yanlış — "5141" yerine TURSAB_NO kullan
### 6.2 Ekip bölümü yok — ekle
```tsx
const ekip = [
  { ad: 'Muratcan', unvan: 'Kurucu & CEO', avatar: 'M' },
  { ad: 'Destek Ekibi', unvan: 'Müşteri Hizmetleri', avatar: 'D' },
]
```

---

## BÖLÜM 7 — PANEL SAYFALARI

### 7.1 /panel/favoriler — localStorage ile favori sistemi
```tsx
'use client'
// localStorage'dan favorileri oku
// Supabase'den o id'lere ait ilanları çek
// Boşsa "Henüz favori eklemediniz" göster
```

### 7.2 /panel/mesajlar — basit inbox
```tsx
// mesajlar tablosundan kullanıcının aldığı/gönderdiği mesajları çek
// Mesaj listesi sol, mesaj detayı sağ
// Yeni mesaj gönder formu
```

### 7.3 /panel/profil — avatar upload
```tsx
// Ad soyad, telefon düzenlenebilir
// Avatar: Supabase Storage'a yükle
// Şifre değiştir butonu → Supabase auth.updateUser
```

---

## BÖLÜM 8 — ADMİN PANELİ — TAM PROFESYONEL

### 8.1 Dashboard — gerçek veriler ve grafikler

```tsx
// app/yonetim/page.tsx
import { createClient } from '@supabase/supabase-js'

export default async function AdminDashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const buAy = new Date()
  buAy.setDate(1)
  buAy.setHours(0, 0, 0, 0)

  const [
    { count: toplamIlan },
    { count: aktifIlan },
    { count: bekleyenIlan },
    { count: toplamKullanici },
    { count: buAyRezervasyonSayisi },
    { data: buAyRezervasyonlar },
    { count: toplamRezervasyonlar },
    { data: sonRezervasyonlar },
    { data: bekleyenIlanlar },
    { data: bugunGirisler },
    { data: bugunCikislar },
  ] = await Promise.all([
    supabase.from('ilanlar').select('*', { count: 'exact', head: true }),
    supabase.from('ilanlar').select('*', { count: 'exact', head: true }).eq('aktif', true),
    supabase.from('ilanlar').select('*', { count: 'exact', head: true }).eq('aktif', false),
    supabase.from('kullanicilar').select('*', { count: 'exact', head: true }),
    supabase.from('rezervasyonlar').select('*', { count: 'exact', head: true })
      .gte('olusturulma_tarihi', buAy.toISOString()),
    supabase.from('rezervasyonlar').select('toplam_fiyat')
      .eq('durum', 'onaylandi')
      .gte('olusturulma_tarihi', buAy.toISOString()),
    supabase.from('rezervasyonlar').select('*', { count: 'exact', head: true }),
    supabase.from('rezervasyonlar')
      .select('*, kullanicilar(ad_soyad), ilanlar(baslik)')
      .order('olusturulma_tarihi', { ascending: false })
      .limit(5),
    supabase.from('ilanlar')
      .select('*, kullanicilar(ad_soyad, email)')
      .eq('aktif', false)
      .order('olusturulma_tarihi', { ascending: false })
      .limit(5),
    supabase.from('rezervasyonlar')
      .select('*, ilanlar(baslik), kullanicilar(ad_soyad, telefon)')
      .eq('giris_tarihi', new Date().toISOString().slice(0, 10))
      .eq('durum', 'onaylandi'),
    supabase.from('rezervasyonlar')
      .select('*, ilanlar(baslik), kullanicilar(ad_soyad, telefon)')
      .eq('cikis_tarihi', new Date().toISOString().slice(0, 10))
      .eq('durum', 'onaylandi'),
  ])

  const buAyGelir = buAyRezervasyonlar?.reduce((sum, r) => sum + (r.toplam_fiyat ?? 0), 0) ?? 0

  return (
    <div>
      {/* İstatistik kartları — 3 satır */}
      
      {/* Satır 1: Ana metrikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatKart label="Toplam İlan" deger={toplamIlan ?? 0} renk="#0ea5e9" ikon="🏠"
          alt={`${aktifIlan} aktif`} />
        <StatKart label="Onay Bekleyen" deger={bekleyenIlan ?? 0} renk="#f59e0b" ikon="⏳"
          alt="İnceleme gerekli" acil={(bekleyenIlan ?? 0) > 0} />
        <StatKart label="Toplam Kullanıcı" deger={toplamKullanici ?? 0} renk="#8b5cf6" ikon="👥" />
        <StatKart label="Toplam Rezervasyon" deger={toplamRezervasyonlar ?? 0} renk="#22c55e" ikon="📅" />
      </div>

      {/* Satır 2: Bu ay */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatKart label="Bu Ay Rezervasyon" deger={buAyRezervasyonSayisi ?? 0} renk="#06b6d4" ikon="📋" />
        <StatKart label="Bu Ay Gelir" deger={`₺${buAyGelir.toLocaleString('tr-TR')}`} renk="#22c55e" ikon="💰" />
      </div>

      {/* Bugün giriş/çıkış uyarıları */}
      {(bugunGirisler?.length ?? 0) > 0 && (
        <div className="admin-card mb-6 border-l-4 border-green-500">
          <h3 className="text-white font-semibold mb-3">
            🏠 Bugün Giriş Yapacaklar ({bugunGirisler?.length})
          </h3>
          {bugunGirisler?.map(rez => (
            <div key={rez.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <div className="text-white text-sm font-medium">{rez.kullanicilar?.ad_soyad}</div>
                <div className="text-gray-400 text-xs">{rez.ilanlar?.baslik}</div>
              </div>
              <div className="text-gray-400 text-xs">{rez.kullanicilar?.telefon}</div>
            </div>
          ))}
        </div>
      )}

      {(bugunCikislar?.length ?? 0) > 0 && (
        <div className="admin-card mb-6 border-l-4 border-amber-500">
          <h3 className="text-white font-semibold mb-3">
            🧳 Bugün Çıkış Yapacaklar ({bugunCikislar?.length})
          </h3>
          {bugunCikislar?.map(rez => (
            <div key={rez.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <div className="text-white text-sm font-medium">{rez.kullanicilar?.ad_soyad}</div>
                <div className="text-gray-400 text-xs">{rez.ilanlar?.baslik}</div>
              </div>
              <div className="text-gray-400 text-xs">{rez.kullanicilar?.telefon}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Onay bekleyen ilanlar */}
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">⏳ Onay Bekleyen İlanlar</h3>
            <a href="/yonetim/ilanlar?filtre=bekleyen"
              className="text-sky-400 hover:text-sky-300 text-xs transition-colors">
              Tümünü Gör →
            </a>
          </div>
          {bekleyenIlanlar?.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-6">Bekleyen ilan yok ✅</div>
          ) : (
            bekleyenIlanlar?.map(ilan => (
              <div key={ilan.id} className="flex items-center justify-between py-2.5
                border-b border-white/5 last:border-0">
                <div>
                  <div className="text-white text-sm font-medium line-clamp-1">{ilan.baslik}</div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    {ilan.kullanicilar?.ad_soyad} · {ilan.konum}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={`/yonetim/ilanlar?id=${ilan.id}`}
                    className="admin-btn admin-btn-primary text-xs py-1 px-3">
                    İncele
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Son rezervasyonlar */}
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">📅 Son Rezervasyonlar</h3>
            <a href="/yonetim/rezervasyonlar"
              className="text-sky-400 hover:text-sky-300 text-xs transition-colors">
              Tümünü Gör →
            </a>
          </div>
          {sonRezervasyonlar?.map(rez => (
            <div key={rez.id} className="flex items-center justify-between py-2.5
              border-b border-white/5 last:border-0">
              <div>
                <div className="text-white text-sm font-medium">{rez.kullanicilar?.ad_soyad}</div>
                <div className="text-gray-400 text-xs mt-0.5 line-clamp-1">{rez.ilanlar?.baslik}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <DurumBadge durum={rez.durum} />
                <div className="text-gray-400 text-xs mt-1">
                  ₺{rez.toplam_fiyat?.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatKart({ label, deger, renk, ikon, alt, acil }: {
  label: string; deger: string | number; renk: string
  ikon: string; alt?: string; acil?: boolean
}) {
  return (
    <div className="admin-stat-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
        style={{ background: renk, filter: 'blur(20px)', transform: 'translate(30%, -30%)' }} />
      <div className="text-2xl mb-2">{ikon}</div>
      <div className="text-2xl font-bold text-white mb-0.5">{deger}</div>
      <div className="text-gray-400 text-xs">{label}</div>
      {alt && (
        <div className={`text-xs mt-1 font-medium ${acil ? 'text-amber-400' : 'text-gray-500'}`}>
          {acil ? '⚠️ ' : ''}{alt}
        </div>
      )}
    </div>
  )
}
```

### 8.2 /yonetim/ilanlar — Tam işlevsel ilan yönetimi

```tsx
// app/yonetim/ilanlar/page.tsx
export default async function AdminIlanlar({ searchParams }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const filtre = searchParams.filtre ?? 'tumu'

  let query = supabase
    .from('ilanlar')
    .select('*, kullanicilar(ad_soyad, email), ilan_medyalari(url, sira)')
    .order('olusturulma_tarihi', { ascending: false })

  if (filtre === 'bekleyen') query = query.eq('aktif', false)
  else if (filtre === 'aktif') query = query.eq('aktif', true)

  const { data: ilanlar } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">İlan Yönetimi</h1>
        <div className="text-gray-400 text-sm">{ilanlar?.length ?? 0} ilan</div>
      </div>

      {/* Filtre tabları */}
      <div className="flex gap-2 mb-6">
        {[
          { slug: 'tumu', label: 'Tümü' },
          { slug: 'bekleyen', label: '⏳ Onay Bekleyen' },
          { slug: 'aktif', label: '✅ Yayında' },
        ].map(({ slug, label }) => (
          <a key={slug} href={`/yonetim/ilanlar?filtre=${slug}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filtre === slug
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'}`}
            style={filtre === slug ? { background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.3)' } : {}}>
            {label}
          </a>
        ))}
      </div>

      {/* İlan tablosu */}
      <div className="admin-card overflow-hidden p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th>İlan</th>
              <th>Sahip</th>
              <th>Tür</th>
              <th>Fiyat</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {ilanlar?.map(ilan => (
              <tr key={ilan.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                      {ilan.ilan_medyalari?.[0]?.url && (
                        <img src={ilan.ilan_medyalari[0].url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium line-clamp-1 max-w-48">{ilan.baslik}</div>
                      <div className="text-gray-400 text-xs">{ilan.konum}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="text-gray-300 text-sm">{ilan.kullanicilar?.ad_soyad}</div>
                  <div className="text-gray-500 text-xs">{ilan.kullanicilar?.email}</div>
                </td>
                <td>
                  <span className={`admin-badge ${ilan.tip === 'villa' ? 'admin-badge-blue' : 'admin-badge-green'}`}>
                    {ilan.tip === 'villa' ? '🏠 Villa' : '⛵ Tekne'}
                  </span>
                </td>
                <td className="text-gray-300 text-sm">₺{ilan.gunluk_fiyat?.toLocaleString('tr-TR')}/gece</td>
                <td>
                  <span className={`admin-badge ${ilan.aktif ? 'admin-badge-green' : 'admin-badge-yellow'}`}>
                    {ilan.aktif ? '✅ Yayında' : '⏳ Bekliyor'}
                  </span>
                </td>
                <td className="text-gray-500 text-xs">
                  {new Date(ilan.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                </td>
                <td>
                  <div className="flex gap-1.5">
                    {!ilan.aktif && (
                      <IlanOnayla ilanId={ilan.id} sahipEmail={ilan.kullanicilar?.email} />
                    )}
                    {ilan.aktif && (
                      <IlanPasif ilanId={ilan.id} />
                    )}
                    <a href={`/${ilan.tip === 'villa' ? 'konaklama' : 'tekneler'}/${ilan.slug ?? ilan.id}`}
                      target="_blank"
                      className="admin-btn admin-btn-ghost text-xs py-1 px-2">
                      👁
                    </a>
                    <a href={`/yonetim/ilanlar/${ilan.id}/takvim`}
                      className="admin-btn admin-btn-ghost text-xs py-1 px-2">
                      📅
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

Server Action'lar:
```tsx
// app/yonetim/ilanlar/actions.ts
'use server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function adminKontrol() {
  const cookieStore = cookies()
  if (!cookieStore.get('admin_session')) throw new Error('Yetkisiz')
}

export async function ilanOnayla(ilanId: string, sahipEmail?: string) {
  adminKontrol()
  const supabase = adminClient()
  
  await supabase.from('ilanlar').update({ aktif: true }).eq('id', ilanId)
  
  // Email bildirimi (Resend ile)
  if (sahipEmail && process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: sahipEmail,
      subject: 'İlanınız Yayına Alındı — SezondalKirala',
      text: 'Tebrikler! İlanınız admin onayından geçerek yayına alındı.',
    }).catch(console.error)
  }
  
  revalidatePath('/yonetim/ilanlar')
}

export async function ilanReddet(ilanId: string, neden: string, sahipEmail?: string) {
  adminKontrol()
  const supabase = adminClient()
  
  await supabase.from('ilanlar').delete().eq('id', ilanId)
  
  if (sahipEmail && process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: sahipEmail,
      subject: 'İlan Başvurusu Hakkında — SezondalKirala',
      text: `İlanınız şu nedenle onaylanamadı: ${neden}`,
    }).catch(console.error)
  }
  
  revalidatePath('/yonetim/ilanlar')
}

export async function ilanSponsorlu(ilanId: string, sponsorlu: boolean) {
  adminKontrol()
  await adminClient().from('ilanlar').update({ sponsorlu }).eq('id', ilanId)
  revalidatePath('/yonetim/ilanlar')
}
```

### 8.3 /yonetim/rezervasyonlar — Tam işlevsel

```tsx
// app/yonetim/rezervasyonlar/page.tsx
export default async function AdminRezervasyonlar({ searchParams }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const durum = searchParams.durum
  const aramaMetni = searchParams.ara

  let query = supabase
    .from('rezervasyonlar')
    .select(`
      *,
      kullanicilar (ad_soyad, email, telefon),
      ilanlar (baslik, konum, tip)
    `)
    .order('olusturulma_tarihi', { ascending: false })

  if (durum && durum !== 'tumu') query = query.eq('durum', durum)
  if (aramaMetni) query = query.ilike('referans_no', `%${aramaMetni}%`)

  const { data: rezervasyonlar } = await query

  const toplamGelir = rezervasyonlar
    ?.filter(r => r.durum === 'onaylandi')
    .reduce((sum, r) => sum + (r.toplam_fiyat ?? 0), 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Rezervasyonlar</h1>
        <div className="text-green-400 font-semibold">
          Toplam Gelir: ₺{toplamGelir.toLocaleString('tr-TR')}
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          {[
            { slug: 'tumu', label: 'Tümü' },
            { slug: 'beklemede', label: '⏳ Beklemede' },
            { slug: 'onaylandi', label: '✅ Onaylı' },
            { slug: 'iptal', label: '❌ İptal' },
          ].map(({ slug, label }) => (
            <a key={slug} href={`/yonetim/rezervasyonlar?durum=${slug}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                ${(durum ?? 'tumu') === slug ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
              style={(durum ?? 'tumu') === slug
                ? { background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.3)' }
                : {}}>
              {label}
            </a>
          ))}
        </div>
        <form method="GET" action="/yonetim/rezervasyonlar">
          <input name="ara" defaultValue={aramaMetni ?? ''}
            placeholder="Referans no ara..."
            className="admin-input text-xs py-1.5 px-3 w-48" />
        </form>
      </div>

      {/* Tablo */}
      <div className="admin-card overflow-hidden p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Referans</th>
              <th>Kullanıcı</th>
              <th>İlan</th>
              <th>Tarihler</th>
              <th>Misafir</th>
              <th>Tutar</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rezervasyonlar?.map(rez => (
              <tr key={rez.id}>
                <td>
                  <div className="font-mono text-sky-400 text-xs">{rez.referans_no}</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(rez.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                  </div>
                </td>
                <td>
                  <div className="text-gray-300 text-sm">{rez.kullanicilar?.ad_soyad}</div>
                  <div className="text-gray-500 text-xs">{rez.kullanicilar?.telefon}</div>
                </td>
                <td>
                  <div className="text-gray-300 text-sm line-clamp-1 max-w-32">{rez.ilanlar?.baslik}</div>
                  <div className="text-gray-500 text-xs">{rez.ilanlar?.konum}</div>
                </td>
                <td>
                  <div className="text-gray-300 text-xs">
                    {new Date(rez.giris_tarihi).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="text-gray-500 text-xs">
                    → {new Date(rez.cikis_tarihi).toLocaleDateString('tr-TR')}
                  </div>
                </td>
                <td className="text-gray-400 text-sm">{rez.misafir_sayisi} kişi</td>
                <td>
                  <div className="text-white font-semibold text-sm">
                    ₺{rez.toplam_fiyat?.toLocaleString('tr-TR')}
                  </div>
                  <div className="text-gray-500 text-xs">{rez.odeme_yontemi}</div>
                </td>
                <td>
                  <span className={`admin-badge ${
                    rez.durum === 'onaylandi' ? 'admin-badge-green' :
                    rez.durum === 'beklemede' ? 'admin-badge-yellow' : 'admin-badge-red'
                  }`}>
                    {rez.durum === 'onaylandi' ? '✅' : rez.durum === 'beklemede' ? '⏳' : '❌'}
                    {' '}{rez.durum}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1.5">
                    {rez.durum === 'beklemede' && (
                      <>
                        <RezervasyonOnayla rezId={rez.id} />
                        <RezervasyonIptal rezId={rez.id} />
                      </>
                    )}
                    <a href={`https://wa.me/${rez.kullanicilar?.telefon?.replace(/\D/g, '')}`}
                      target="_blank"
                      className="admin-btn admin-btn-ghost text-xs py-1 px-2">
                      💬
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 8.4 /yonetim/kullanicilar — Kullanıcı yönetimi

```tsx
export default async function AdminKullanicilar({ searchParams }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: kullanicilar } = await supabase
    .from('kullanicilar')
    .select('*')
    .order('olusturulma_tarihi', { ascending: false })

  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-6">Kullanıcı Yönetimi</h1>

      <div className="admin-card overflow-hidden p-0">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>E-posta</th>
              <th>Telefon</th>
              <th>Rol</th>
              <th>Kayıt Tarihi</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {kullanicilar?.map(k => (
              <tr key={k.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center
                      text-white font-bold text-xs flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #0ea5e9, #22c55e)' }}>
                      {k.ad_soyad?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-gray-300 text-sm font-medium">{k.ad_soyad ?? '—'}</span>
                  </div>
                </td>
                <td className="text-gray-400 text-sm">{k.email}</td>
                <td className="text-gray-400 text-sm">{k.telefon ?? '—'}</td>
                <td>
                  <RolDegistir kullaniciId={k.id} mevcutRol={k.rol} />
                </td>
                <td className="text-gray-500 text-xs">
                  {new Date(k.olusturulma_tarihi).toLocaleDateString('tr-TR')}
                </td>
                <td>
                  <a href={`mailto:${k.email}`}
                    className="admin-btn admin-btn-ghost text-xs py-1 px-2">
                    ✉️
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 8.5 /yonetim/ilanlar/[id]/takvim — Çalışır takvim yönetimi

```tsx
// app/yonetim/ilanlar/[id]/takvim/page.tsx — sayfa başlığını göster
export default async function IlanTakvim({ params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ilan } = await supabase
    .from('ilanlar')
    .select('baslik, konum, gunluk_fiyat')
    .eq('id', params.id)
    .single()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/yonetim/ilanlar" className="text-gray-400 hover:text-gray-200 text-sm">
          ← İlanlara Dön
        </a>
      </div>
      <h1 className="text-white text-xl font-bold mb-1">{ilan?.baslik}</h1>
      <p className="text-gray-400 text-sm mb-6">
        {ilan?.konum} · ₺{ilan?.gunluk_fiyat?.toLocaleString('tr-TR')}/gece
      </p>
      <TakvimYonetimi ilanId={params.id} />
    </div>
  )
}
```

### 8.6 Rezervasyon onay/iptal Server Actions
```tsx
// app/yonetim/rezervasyonlar/actions.ts
'use server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { eachDayOfInterval, format } from 'date-fns'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function rezervasyonOnayla(rezId: string) {
  const cookieStore = cookies()
  if (!cookieStore.get('admin_session')) throw new Error('Yetkisiz')

  const supabase = adminClient()

  const { data: rez } = await supabase
    .from('rezervasyonlar')
    .update({ durum: 'onaylandi' })
    .eq('id', rezId)
    .select('ilan_id, giris_tarihi, cikis_tarihi, kullanicilar(email)')
    .single()

  // Takvimi otomatik doldur
  if (rez?.ilan_id && rez.giris_tarihi && rez.cikis_tarihi) {
    const gunler = eachDayOfInterval({
      start: new Date(rez.giris_tarihi),
      end: new Date(rez.cikis_tarihi),
    })
    const rows = gunler.map(g => ({
      ilan_id: rez.ilan_id,
      tarih: format(g, 'yyyy-MM-dd'),
      durum: 'dolu',
    }))
    await supabase.from('musaitlik').upsert(rows, { onConflict: 'ilan_id,tarih' })
  }

  revalidatePath('/yonetim/rezervasyonlar')
}

export async function rezervasyonIptal(rezId: string) {
  const cookieStore = cookies()
  if (!cookieStore.get('admin_session')) throw new Error('Yetkisiz')

  const supabase = adminClient()

  const { data: rez } = await supabase
    .from('rezervasyonlar')
    .update({ durum: 'iptal' })
    .eq('id', rezId)
    .select('ilan_id, giris_tarihi, cikis_tarihi')
    .single()

  // Takvimden sil
  if (rez?.ilan_id && rez.giris_tarihi && rez.cikis_tarihi) {
    const gunler = eachDayOfInterval({
      start: new Date(rez.giris_tarihi),
      end: new Date(rez.cikis_tarihi),
    })
    await supabase
      .from('musaitlik')
      .delete()
      .eq('ilan_id', rez.ilan_id)
      .in('tarih', gunler.map(g => format(g, 'yyyy-MM-dd')))
  }

  revalidatePath('/yonetim/rezervasyonlar')
}
```

### 8.7 DurumBadge bileşeni — admin genelinde kullan
```tsx
// components/admin/DurumBadge.tsx
export function DurumBadge({ durum }: { durum: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    beklemede: { label: '⏳ Beklemede', cls: 'admin-badge-yellow' },
    onaylandi: { label: '✅ Onaylandı', cls: 'admin-badge-green' },
    iptal: { label: '❌ İptal', cls: 'admin-badge-red' },
    aktif: { label: '✅ Aktif', cls: 'admin-badge-green' },
    pasif: { label: '⏸ Pasif', cls: 'admin-badge-yellow' },
  }
  const { label, cls } = map[durum] ?? { label: durum, cls: 'admin-badge-blue' }
  return <span className={`admin-badge ${cls}`}>{label}</span>
}
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test listesi:
1. Ana sayfada istatistikler gerçek veri mi? (0+ değil)
2. Paket sekmeleri tıklanınca sayfa başına atıyor mu? (Atmamalı)
3. İletişim formu Resend ile gerçek mail gönderiyor mu?
4. TURSAB numarası her yerde 14382 mi?
5. Admin dashboard bugün giriş/çıkış listesi görünüyor mu?
6. Admin ilanlar sayfasında onayla/reddet çalışıyor mu?
7. Admin rezervasyonlar — onaylayınca takvim doldu mu?
8. Admin rezervasyonlar — filtreler çalışıyor mu?
9. SSS accordion tasarımı güzelleşti mi?
10. İletişim sayfası iki kolonlu mu?
```
