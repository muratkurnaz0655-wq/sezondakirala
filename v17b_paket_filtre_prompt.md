# SezondalKirala — Paket Sekmeleri, Filtre & Genel Düzeltmeler

---

## BÖLÜM 1 — PAKET SEKMELERİ SAYFANIN BAŞINA ATIYOR (KRİTİK)

### Sorun
Ana sayfada "Hazır Tatil Paketleri" altındaki Tümü/Macera/Lüks sekmelerine tıklanınca sayfa en üste gidiyor. Sekmeler `href="/"` veya `href="/?kategori=macera"` şeklinde link — bu yüzden sayfa başına atıyor.

### Çözüm — Client Component, onClick ile state değişikliği

`components/PaketFiltreler.tsx` veya ana sayfadaki paket section'ını bul.
Sekme linkleri `<Link href>` yerine `<button onClick>` olmalı:

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'

const kategoriler = [
  { slug: 'tumu', label: 'Tümü' },
  { slug: 'macera', label: '🧭 Macera' },
  { slug: 'luks', label: '✨ Lüks' },
  { slug: 'romantik', label: '💑 Romantik' },
  { slug: 'aile', label: '👨‍👩‍👧‍👦 Aile' },
]

export function PaketFiltreler({ paketler }: { paketler: any[] }) {
  const [aktif, setAktif] = useState('tumu')

  const gorunen = aktif === 'tumu'
    ? paketler
    : paketler.filter(p => p.kategori === aktif)

  return (
    <div>
      {/* Sekmeler — href YOK, sadece onClick */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {kategoriler.map(({ slug, label }) => (
          <button
            key={slug}
            onClick={() => setAktif(slug)}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all
              ${aktif === slug
                ? 'text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-sky-300'}`}
            style={aktif === slug
              ? { background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }
              : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Paket kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gorunen.map(paket => (
          <Link key={paket.id} href={`/paketler/${paket.id}`}>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border
              border-gray-100 hover:-translate-y-2 transition-all duration-300
              hover:shadow-xl cursor-pointer group">
              {/* Görsel */}
              {paket.gorsel_url && (
                <div className="relative h-48 overflow-hidden">
                  <img src={paket.gorsel_url} alt={paket.baslik}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ background: kategoriGradient(paket.kategori) }}>
                    {paket.kategori}
                  </span>
                </div>
              )}
              <div className="p-5">
                <h3 className="font-bold text-gray-900 mb-2">{paket.baslik}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{paket.aciklama}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span>⏱ {paket.sure_gun} gün</span>
                  <span>👥 Max {paket.kapasite} kişi</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-sky-600">
                      ₺{paket.fiyat?.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-gray-400 text-xs"> toplam</span>
                  </div>
                  <span className="text-sky-500 text-sm font-semibold group-hover:underline">
                    İncele →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {gorunen.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Bu kategoride henüz paket bulunmuyor
        </div>
      )}
    </div>
  )
}

function kategoriGradient(kategori: string) {
  const map: Record<string, string> = {
    macera: 'linear-gradient(135deg, #f59e0b, #d97706)',
    luks: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    romantik: 'linear-gradient(135deg, #ec4899, #db2777)',
    aile: 'linear-gradient(135deg, #22c55e, #16a34a)',
  }
  return map[kategori] ?? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
}
```

Ana sayfada kullan:
```tsx
// app/page.tsx — paket section
const { data: paketler } = await supabase
  .from('paketler')
  .select('*')
  .eq('aktif', true)
  .order('olusturulma_tarihi', { ascending: false })

// Server component'ten client component'e geç:
<PaketFiltreler paketler={paketler ?? []} />
```

---

## BÖLÜM 2 — /paketler SAYFASI DÜZELTMELERİ

### 2.1 Kategori sekmeleri aynı sorunu düzelt
```tsx
// app/paketler/page.tsx — useRouter ile:
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const router = useRouter()
const searchParams = useSearchParams()
const aktifKategori = searchParams.get('kategori') ?? 'tumu'

const kategoriDegistir = (slug: string) => {
  if (slug === 'tumu') {
    router.push('/paketler', { scroll: false })
  } else {
    router.push(`/paketler?kategori=${slug}`, { scroll: false })
  }
}
```

### 2.2 Sayfa başlığı — turuncu/sıcak gradient
```tsx
<div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)' }}
  className="py-16 text-white text-center relative overflow-hidden">
  <div className="absolute inset-0 opacity-10"
    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
  <div className="relative z-10">
    <h1 className="text-4xl md:text-5xl font-bold mb-3">Fethiye Tatil Paketleri</h1>
    <p className="text-orange-100 text-lg">Konaklama + aktivite bir arada, en uygun fiyatlarla</p>
  </div>
</div>
```

### 2.3 Paket detay — dahil olan ilanlar boş geliyor
```tsx
// app/paketler/[id]/page.tsx
const ilanIdleri: string[] = Array.isArray(paket.ilan_idleri)
  ? paket.ilan_idleri
  : (() => { try { return JSON.parse(paket.ilan_idleri ?? '[]') } catch { return [] } })()

const { data: dahilIlanlar } = ilanIdleri.length > 0
  ? await supabase
      .from('ilanlar')
      .select('id, baslik, konum, gunluk_fiyat, tip, ilan_medyalari(url, sira)')
      .in('id', ilanIdleri)
  : { data: [] }
```

---

## BÖLÜM 3 — FİLTRELER KONTROL & DÜZELTME

### 3.1 /konaklama — tüm filtreler çalışır hale getir

```tsx
// app/konaklama/page.tsx — tam filtre sorgusu
export default async function KonaklamaSayfasi({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = createClient()

  let query = supabase
    .from('ilanlar')
    .select('*, ilan_medyalari(url, sira)')
    .eq('aktif', true)
    .eq('tip', 'villa')

  if (searchParams.fiyat_min) query = query.gte('gunluk_fiyat', Number(searchParams.fiyat_min))
  if (searchParams.fiyat_max) query = query.lte('gunluk_fiyat', Number(searchParams.fiyat_max))
  if (searchParams.kapasite) query = query.gte('kapasite', Number(searchParams.kapasite))
  if (searchParams.yatak_odasi) query = query.gte('yatak_odasi', Number(searchParams.yatak_odasi))
  if (searchParams.konum) query = query.ilike('konum', `%${searchParams.konum}%`)

  // Özellik filtreleri
  for (const ozellik of ['havuz','wifi','klima','deniz_manzarasi','bahce','bbq','jakuzi','evcil_hayvan']) {
    if (searchParams[ozellik] === 'true') {
      query = query.filter(`ozellikler->>${ozellik}`, 'eq', 'true')
    }
  }

  // Müsaitlik filtresi
  if (searchParams.giris && searchParams.cikis) {
    const { data: doluMusaitlik } = await supabase
      .from('musaitlik')
      .select('ilan_id')
      .gte('tarih', searchParams.giris)
      .lt('tarih', searchParams.cikis)
      .eq('durum', 'dolu')

    const { data: doluRezervasyonlar } = await supabase
      .from('rezervasyonlar')
      .select('ilan_id')
      .in('durum', ['beklemede', 'onaylandi'])
      .lt('giris_tarihi', searchParams.cikis)
      .gt('cikis_tarihi', searchParams.giris)

    const doluIdler = [...new Set([
      ...(doluMusaitlik?.map(d => d.ilan_id) ?? []),
      ...(doluRezervasyonlar?.map(r => r.ilan_id) ?? []),
    ])]

    if (doluIdler.length > 0) {
      query = query.not('id', 'in', `(${doluIdler.join(',')})`)
    }
  }

  // Sıralama
  switch (searchParams.siralama) {
    case 'fiyat_artan': query = query.order('gunluk_fiyat', { ascending: true }); break
    case 'fiyat_azalan': query = query.order('gunluk_fiyat', { ascending: false }); break
    case 'en_yeni': query = query.order('olusturulma_tarihi', { ascending: false }); break
    default: query = query.order('sponsorlu', { ascending: false })
  }

  const { data: ilanlar, error } = await query
  if (error) console.error('İlan hatası:', error)

  const geceSayisi = searchParams.giris && searchParams.cikis
    ? Math.round((new Date(searchParams.cikis).getTime() - new Date(searchParams.giris).getTime()) / 86400000)
    : 0

  return (
    <div>
      {/* ... sayfa içeriği ... */}
    </div>
  )
}
```

### 3.2 Filtre sidebar — scroll: false ekle

```tsx
// components/VillaFiltreSidebar.tsx
const setParam = useCallback((key: string, value: string | null) => {
  const params = new URLSearchParams(searchParams.toString())
  if (!value) {
    params.delete(key)
  } else {
    params.set(key, value)
  }
  router.push(`${pathname}?${params.toString()}`, { scroll: false }) // scroll: false kritik
}, [router, searchParams, pathname])
```

### 3.3 /tekneler — sadece tekneye özel filtreler

```tsx
// components/TekneFiltreSidebar.tsx
// Villa özelliklerini (havuz, jakuzi, bahce, bbq, deniz_manzarasi) KALDIR
// Sadece tekneye özel özellikler:
const tekneOzellikleri = [
  { key: 'wifi', label: 'WiFi', emoji: '📶' },
  { key: 'klima', label: 'Klima', emoji: '❄️' },
  { key: 'kabin', label: 'Özel Kabin', emoji: '🛏️' },
  { key: 'kaptan_dahil', label: 'Kaptan Dahil', emoji: '👨‍✈️' },
  { key: 'generator', label: 'Jeneratör', emoji: '⚡' },
]
```

---

## BÖLÜM 4 — GENEL DÜZELTMELER

### 4.1 Ana sayfa istatistikleri — gerçek veri
```tsx
// app/page.tsx
const [
  { count: aktifIlanSayisi },
  { count: aktifTekneSayisi },
  { count: toplamRezervasyonSayisi },
] = await Promise.all([
  supabase.from('ilanlar').select('*', { count: 'exact', head: true }).eq('aktif', true).eq('tip', 'villa'),
  supabase.from('ilanlar').select('*', { count: 'exact', head: true }).eq('aktif', true).eq('tip', 'tekne'),
  supabase.from('rezervasyonlar').select('*', { count: 'exact', head: true }),
])

// Gösterim:
// "😊 {toplamRezervasyonSayisi}+ Mutlu Misafir"
// "🏠 {aktifIlanSayisi}+ Onaylı Villa"
// "⛵ {aktifTekneSayisi}+ Özel Tekne"
```

### 4.2 Yorum kartlarında gerçek kullanıcı adı
```tsx
const { data: yorumlar } = await supabase
  .from('yorumlar')
  .select(`
    *,
    kullanicilar (ad_soyad),
    ilanlar (baslik)
  `)
  .order('olusturulma_tarihi', { ascending: false })
  .limit(6)

// Kullanıcı adı gösterimi:
{yorum.kullanicilar?.ad_soyad ?? 'Misafir'}
```

### 4.3 Türkçe karakter düzeltmeleri — tüm sayfalar
```bash
# Terminalde çalıştır:
grep -rn "macera\b\|luks\b\|romantik\b\|aile\b\|Kayakoy\|Oludeniz\|Gocek\|Gulet\|Calis\|Hisaronu\|Balayi\|Ozel\|Ice Ice\|Kacamak" app/ components/ --include="*.tsx" --include="*.ts"
```
Bulduklarını düzelt:
- `macera` badge → `Macera`
- `luks` badge → `Lüks`
- `romantik` badge → `Romantik`
- `Kayakoy` → `Kayaköy`
- `Oludeniz` → `Ölüdeniz`
- `Gocek` → `Göcek`
- `Gulet` → `Gület`
- `Calis` → `Çalış`
- `Hisaronu` → `Hisarönü`
- `Balayi` → `Balayı`

### 4.4 Paket kartları — grid 3 kolon
```tsx
// Ana sayfada ve /paketler sayfasında:
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test:
1. Ana sayfada "Macera" sekmesine tıkla → sayfa başına ATMIYOR mu?
2. Sadece macera paketleri mi görünüyor?
3. /konaklama → Havuz filtresi → URL ?havuz=true, ilanlar filtrelendi mi?
4. /tekneler → Havuz/jakuzi YOK, sadece tekne özellikleri var mı?
5. Ana sayfada istatistikler gerçek sayı mı?
6. Yorum kartlarında "Misafir" değil gerçek isim mi?
7. /paketler/[id] → Dahil İlanlar geliyor mu?
