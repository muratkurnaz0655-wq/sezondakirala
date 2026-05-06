# SezondalKirala — Rezervasyon Detay, Tarih Parametreleri & UI Geliştirme Promptu

Siteyi test ettim. Aşağıdaki sorunları sırayla düzelt.

---

## BÖLÜM 1 — REZERVASYONLARIM DETAY SAYFASI

### 1.1 /panel/rezervasyonlar — Tıklanabilir kartlar

Şu an rezervasyonlar listesi var ama tıklanınca hiçbir şey olmuyor. Her rezervasyon kartı `/panel/rezervasyonlar/[id]` sayfasına yönlendirmeli.

```tsx
// app/panel/rezervasyonlar/page.tsx — her kart Link ile sarılı
import Link from 'next/link'

{rezervasyonlar.map(rez => (
  <Link key={rez.id} href={`/panel/rezervasyonlar/${rez.id}`}>
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md
      hover:border-sky-200 transition-all cursor-pointer group">
      
      {/* İlan görseli + bilgi */}
      <div className="flex gap-4">
        <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          <Image
            src={rez.ilanlar?.ilan_medyalari?.[0]?.url ?? '/images/villa-placeholder.jpg'}
            alt={rez.ilanlar?.baslik ?? 'İlan'}
            fill className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-sky-600 transition-colors">
              {rez.ilanlar?.baslik ?? 'İlan'}
            </h3>
            <DurumBadge durum={rez.durum} />
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <MapPin size={11} /> {rez.ilanlar?.konum}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {format(new Date(rez.giris_tarihi), 'd MMM', { locale: tr })}
              {' → '}
              {format(new Date(rez.cikis_tarihi), 'd MMM yyyy', { locale: tr })}
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} /> {rez.misafir_sayisi} kişi
            </span>
          </div>
        </div>
      </div>

      {/* Alt bar */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div>
          <span className="font-bold text-gray-900">
            ₺{rez.toplam_fiyat?.toLocaleString('tr-TR')}
          </span>
          <span className="text-xs text-gray-400 ml-1">toplam</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">{rez.referans_no}</span>
          <ChevronRight size={14} className="text-gray-400 group-hover:text-sky-500 transition-colors" />
        </div>
      </div>
    </div>
  </Link>
))}
```

### 1.2 /panel/rezervasyonlar/[id] — Detay sayfası oluştur

```tsx
// app/panel/rezervasyonlar/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'

export default async function RezervasyonDetay({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: rez } = await supabase
    .from('rezervasyonlar')
    .select(`
      *,
      ilanlar (
        baslik, konum, tip, gunluk_fiyat, temizlik_ucreti,
        ilan_medyalari (url, sira)
      )
    `)
    .eq('id', params.id)
    .eq('kullanici_id', user.id)
    .single()

  if (!rez) notFound()

  const geceSayisi = differenceInDays(
    new Date(rez.cikis_tarihi),
    new Date(rez.giris_tarihi)
  )

  const durumRenk = {
    beklemede: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: '⏳ Onay Bekleniyor' },
    onaylandi: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: '✅ Onaylandı' },
    iptal: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: '❌ İptal Edildi' },
  }[rez.durum] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: rez.durum }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Geri butonu */}
      <a href="/panel/rezervasyonlar"
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ChevronLeft size={16} /> Rezervasyonlarıma Dön
      </a>

      {/* Durum banner */}
      <div className={`${durumRenk.bg} ${durumRenk.border} border rounded-2xl p-4 mb-6 text-center`}>
        <div className={`${durumRenk.text} font-bold text-lg`}>{durumRenk.label}</div>
        <div className="text-gray-500 text-sm mt-1">Referans: <span className="font-mono font-semibold">{rez.referans_no}</span></div>
      </div>

      {/* İlan kartı */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="relative h-48">
          <Image
            src={rez.ilanlar?.ilan_medyalari?.[0]?.url ?? '/images/villa-placeholder.jpg'}
            alt={rez.ilanlar?.baslik ?? ''}
            fill className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <div className="font-bold text-lg">{rez.ilanlar?.baslik}</div>
            <div className="text-white/80 text-sm flex items-center gap-1">
              <MapPin size={12} /> {rez.ilanlar?.konum}
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Tarihler */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-400 mb-1">Giriş</div>
              <div className="font-bold text-gray-900 text-sm">
                {format(new Date(rez.giris_tarihi), 'd MMM', { locale: tr })}
              </div>
              <div className="text-xs text-gray-400">
                {format(new Date(rez.giris_tarihi), 'yyyy')}
              </div>
            </div>
            <div className="text-center p-3 bg-sky-50 rounded-xl">
              <div className="text-xs text-sky-500 mb-1">Süre</div>
              <div className="font-bold text-sky-700 text-lg">{geceSayisi}</div>
              <div className="text-xs text-sky-500">gece</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-400 mb-1">Çıkış</div>
              <div className="font-bold text-gray-900 text-sm">
                {format(new Date(rez.cikis_tarihi), 'd MMM', { locale: tr })}
              </div>
              <div className="text-xs text-gray-400">
                {format(new Date(rez.cikis_tarihi), 'yyyy')}
              </div>
            </div>
          </div>

          {/* Misafir */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-5 pb-5 border-b border-gray-100">
            <Users size={16} className="text-gray-400" />
            <span>{rez.misafir_sayisi} misafir</span>
          </div>

          {/* Fiyat detayı */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                ₺{rez.ilanlar?.gunluk_fiyat?.toLocaleString('tr-TR')} × {geceSayisi} gece
              </span>
              <span>₺{((rez.ilanlar?.gunluk_fiyat ?? 0) * geceSayisi).toLocaleString('tr-TR')}</span>
            </div>
            {(rez.ilanlar?.temizlik_ucreti ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Temizlik ücreti</span>
                <span>₺{rez.ilanlar?.temizlik_ucreti?.toLocaleString('tr-TR')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100">
              <span>Toplam</span>
              <span className="text-sky-600">₺{rez.toplam_fiyat?.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          {/* Ödeme yöntemi */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Ödeme Yöntemi</span>
            <span className="font-medium">
              {rez.odeme_yontemi === 'kart' ? '💳 Kredi Kartı' : '🏦 Havale'}
            </span>
          </div>
        </div>
      </div>

      {/* WhatsApp butonu */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Merhaba, ${rez.referans_no} referans numaralı rezervasyonum hakkında bilgi almak istiyorum.`)}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl
          bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors">
        💬 WhatsApp ile İletişime Geç
      </a>

      {/* TURSAB */}
      <div className="text-center text-xs text-gray-400 mt-4">
        TURSAB Üyesidir — Belge No: {TURSAB_NO}
      </div>
    </div>
  )
}
```

---

## BÖLÜM 2 — TARİH PARAMETRELERİ — URL'DEN OTOMATIK DOLDURMA

### 2.1 Sorun
Ana sayfada tarih aralığı seçip "Villa Ara" denince `/konaklama?giris=2026-06-25&cikis=2026-07-02` URL'ine gidiyor. İlan listesinde toplam fiyat doğru gösteriyor. Ama ilan detayına girince tarihler unutuluyor.

### 2.2 İlan listesi → İlan detay linkine tarih parametresi ekle

```tsx
// Villa kartında href'i güncelle — tarih parametrelerini taşı
// components/VillaKart.tsx veya konaklama/page.tsx içindeki kart

const ilanUrl = new URL(`/konaklama/${ilan.slug ?? ilan.id}`, 'https://sezondakirala.com')
if (searchParams?.giris) ilanUrl.searchParams.set('giris', searchParams.giris)
if (searchParams?.cikis) ilanUrl.searchParams.set('cikis', searchParams.cikis)
if (searchParams?.yetiskin) ilanUrl.searchParams.set('yetiskin', searchParams.yetiskin)
if (searchParams?.cocuk) ilanUrl.searchParams.set('cocuk', searchParams.cocuk)

<Link href={ilanUrl.pathname + ilanUrl.search}>
  {/* kart içeriği */}
</Link>
```

### 2.3 İlan detay sayfası — URL'den tarihleri oku ve göster

```tsx
// app/konaklama/[slug]/page.tsx — searchParams'tan tarihleri al
export default async function IlanDetay({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { giris?: string; cikis?: string; yetiskin?: string; cocuk?: string }
}) {
  // ...ilan çek...

  return (
    <IlanDetayClient
      ilan={ilan}
      // URL'den gelen tarihleri prop olarak geç
      baslangicGiris={searchParams.giris ?? ''}
      baslangicCikis={searchParams.cikis ?? ''}
      baslangicYetiskin={Number(searchParams.yetiskin ?? 2)}
      baslangicCocuk={Number(searchParams.cocuk ?? 0)}
    />
  )
}
```

### 2.4 İlan detay client — tarihleri baştan seçili göster

```tsx
// components/IlanDetayClient.tsx (veya mevcut client bileşen)
'use client'

export function IlanDetayClient({
  ilan,
  baslangicGiris,
  baslangicCikis,
  baslangicYetiskin,
  baslangicCocuk,
}) {
  // Tarihleri URL'den başlat
  const [seciliGiris, setSeciliGiris] = useState(baslangicGiris)
  const [seciliCikis, setSeciliCikis] = useState(baslangicCikis)
  const [yetiskin, setYetiskin] = useState(baslangicYetiskin)
  const [cocuk, setCocuk] = useState(baslangicCocuk)

  // Gece sayısı ve fiyat
  const geceSayisi = seciliGiris && seciliCikis
    ? differenceInDays(new Date(seciliCikis), new Date(seciliGiris))
    : 0

  const toplamFiyat = geceSayisi > 0
    ? geceSayisi * ilan.gunluk_fiyat + ilan.temizlik_ucreti
    : 0

  // Fiyat kartı — tarihler seçiliyse toplam göster, değilse gecelik
  return (
    <div>
      {/* ... ilan içeriği ... */}

      {/* Sağ sticky fiyat kartı */}
      <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        
        {/* Fiyat başlık */}
        <div className="mb-4">
          {geceSayisi > 0 ? (
            <>
              <div className="text-2xl font-bold text-gray-900">
                ₺{toplamFiyat.toLocaleString('tr-TR')}
              </div>
              <div className="text-sm text-gray-500">{geceSayisi} gece toplam</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-gray-900">
                ₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')}
              </div>
              <div className="text-sm text-gray-500">/ gece</div>
            </>
          )}
        </div>

        {/* Tarih seçici — URL'den geliyorsa dolu göster */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setTakvimAcik('giris')}>
              <div className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Giriş</div>
              <div className={`text-sm font-semibold ${seciliGiris ? 'text-gray-900' : 'text-gray-400'}`}>
                {seciliGiris
                  ? format(new Date(seciliGiris), 'd MMM yyyy', { locale: tr })
                  : 'Ekle'}
              </div>
            </div>
            <div className="p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setTakvimAcik('cikis')}>
              <div className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Çıkış</div>
              <div className={`text-sm font-semibold ${seciliCikis ? 'text-gray-900' : 'text-gray-400'}`}>
                {seciliCikis
                  ? format(new Date(seciliCikis), 'd MMM yyyy', { locale: tr })
                  : 'Ekle'}
              </div>
            </div>
          </div>
        </div>

        {/* Fiyat detayı — tarih seçilince göster */}
        {geceSayisi > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 mb-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">
                ₺{ilan.gunluk_fiyat.toLocaleString('tr-TR')} × {geceSayisi} gece
              </span>
              <span>₺{(ilan.gunluk_fiyat * geceSayisi).toLocaleString('tr-TR')}</span>
            </div>
            {ilan.temizlik_ucreti > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Temizlik</span>
                <span>₺{ilan.temizlik_ucreti.toLocaleString('tr-TR')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
              <span>Toplam</span>
              <span className="text-sky-600">₺{toplamFiyat.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        )}

        {/* Rezervasyon butonu */}
        <a
          href={`/giris?redirect=${encodeURIComponent(
            `/rezervasyon/${ilan.id}?giris=${seciliGiris}&cikis=${seciliCikis}&yetiskin=${yetiskin}&cocuk=${cocuk}`
          )}`}
          className="block w-full py-3.5 text-center rounded-xl bg-sky-500 hover:bg-sky-600
            text-white font-bold transition-colors mb-3">
          {geceSayisi > 0
            ? `₺${toplamFiyat.toLocaleString('tr-TR')} — Rezervasyon Yap`
            : 'Rezervasyon Yap'}
        </a>

        <p className="text-xs text-gray-400 text-center">Henüz ücret alınmadı</p>
      </div>
    </div>
  )
}
```

---

## BÖLÜM 3 — REZERVASYON WIZARD — TARİH PARAMETREDEN BAŞLAT

```tsx
// components/RezervasyonWizard.tsx
// searchParams'tan tarihleri oku ve state'i başlat

const [girisTarihi, setGirisTarihi] = useState(searchParams?.giris ?? '')
const [cikisTarihi, setCikisTarihi] = useState(searchParams?.cikis ?? '')
const [yetiskin, setYetiskin] = useState(Number(searchParams?.yetiskin ?? 2))
const [cocuk, setCocuk] = useState(Number(searchParams?.cocuk ?? 0))
const [bebek, setBebek] = useState(0)

// Adım 1'de tarihler zaten dolu gözükür
// Kullanıcı değiştirebilir ama baştan seçmek zorunda kalmaz
```

---

## BÖLÜM 4 — REZERVASYON WIZARD TASARIM İYİLEŞTİRME

### 4.1 Adım göstergesi — daha canlı

```tsx
// Üst kısımda tam genişlik progress bar
<div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-20">
  <div className="max-w-5xl mx-auto">
    {/* Progress bar */}
    <div className="flex items-center gap-0 mb-1">
      {[1,2,3,4].map((i, idx) => (
        <div key={i} className="flex items-center flex-1">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full
            font-bold text-sm flex-shrink-0 transition-all duration-300
            ${aktifAdim > i
              ? 'bg-green-500 text-white shadow-green-200 shadow-md'
              : aktifAdim === i
              ? 'bg-sky-500 text-white shadow-sky-200 shadow-md ring-4 ring-sky-100'
              : 'bg-gray-100 text-gray-400'}`}>
            {aktifAdim > i ? <Check size={14} /> : i}
          </div>
          {idx < 3 && (
            <div className={`flex-1 h-0.5 mx-1 transition-all duration-500
              ${aktifAdim > i ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
    {/* Adım isimleri */}
    <div className="flex justify-between mt-1">
      {['Tarihler', 'Bilgiler', 'Ödeme', 'Onay'].map((ad, i) => (
        <span key={ad} className={`text-xs font-medium ${
          aktifAdim === i + 1 ? 'text-sky-600' :
          aktifAdim > i + 1 ? 'text-green-600' : 'text-gray-400'
        }`}>{ad}</span>
      ))}
    </div>
  </div>
</div>
```

### 4.2 Adım 1 — Tarihler zaten seçiliyse özet göster

```tsx
{aktifAdim === 1 && (
  <div>
    <h2 className="text-xl font-bold text-gray-900 mb-1">Rezervasyon Detayları</h2>
    <p className="text-gray-500 text-sm mb-6">{ilan.baslik}</p>

    {/* Tarihler seçiliyse yeşil onay göster */}
    {girisTarihi && cikisTarihi && (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4
        flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center
          justify-center flex-shrink-0">
          <Check size={16} className="text-white" />
        </div>
        <div>
          <div className="font-semibold text-green-800 text-sm">Tarihler seçildi</div>
          <div className="text-green-600 text-xs">
            {format(new Date(girisTarihi), 'd MMM', { locale: tr })}
            {' → '}
            {format(new Date(cikisTarihi), 'd MMM yyyy', { locale: tr })}
            {' · '}{geceSayisi} gece
          </div>
        </div>
        <button className="ml-auto text-xs text-green-600 underline"
          onClick={() => { setGirisTarihi(''); setCikisTarihi('') }}>
          Değiştir
        </button>
      </div>
    )}

    {/* Tarih input'ları */}
    <div className="grid grid-cols-2 gap-3 mb-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase
          tracking-wider mb-2">Giriş Tarihi *</label>
        <input
          type="date"
          value={girisTarihi}
          min={format(new Date(), 'yyyy-MM-dd')}
          onChange={e => setGirisTarihi(e.target.value)}
          className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none
            transition-colors ${girisTarihi
              ? 'border-sky-400 bg-sky-50 text-sky-800'
              : 'border-gray-200 focus:border-sky-400'}`}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase
          tracking-wider mb-2">Çıkış Tarihi *</label>
        <input
          type="date"
          value={cikisTarihi}
          min={girisTarihi || format(new Date(), 'yyyy-MM-dd')}
          onChange={e => setCikisTarihi(e.target.value)}
          className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none
            transition-colors ${cikisTarihi
              ? 'border-sky-400 bg-sky-50 text-sky-800'
              : 'border-gray-200 focus:border-sky-400'}`}
        />
      </div>
    </div>

    {/* Misafir seçici */}
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {[
        { label: 'Yetişkin', desc: '13 yaş ve üzeri', val: yetiskin, set: setYetiskin, min: 1, max: 20 },
        { label: 'Çocuk', desc: '2–12 yaş', val: cocuk, set: setCocuk, min: 0, max: 10 },
        { label: 'Bebek', desc: '0–2 yaş', val: bebek, set: setBebek, min: 0, max: 5 },
      ].map(({ label, desc, val, set, min, max }, idx, arr) => (
        <div key={label}
          className={`flex items-center justify-between px-4 py-3.5
            ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
          <div>
            <div className="font-medium text-gray-900 text-sm">{label}</div>
            <div className="text-xs text-gray-400">{desc}</div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button"
              onClick={() => set(v => Math.max(min, v - 1))}
              disabled={val <= min}
              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center
                justify-center text-gray-700 hover:border-sky-400 hover:text-sky-600
                disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg">
              −
            </button>
            <span className="w-6 text-center font-bold text-gray-900">{val}</span>
            <button type="button"
              onClick={() => set(v => Math.min(max, v + 1))}
              disabled={val >= max}
              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center
                justify-center text-gray-700 hover:border-sky-400 hover:text-sky-600
                disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg">
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test listesi:
1. /panel/rezervasyonlar — kartlara tıklanınca detay sayfası açılıyor mu?
2. /panel/rezervasyonlar/[id] — tarihler, fiyat, durum görünüyor mu?
3. Ana sayfada 25 Haz–2 Tem seç → Villa Ara → ilan kartına tıkla → detay sayfasında tarihler seçili mi?
4. İlan detayında toplam fiyat (7 gece × ₺4.500 + temizlik = toplam) gösteriyor mu?
5. "Rezervasyon Yap"a bas → rezervasyon sayfasında tarihler otomatik dolu mu?
6. Wizard adım göstergesi canlı animasyonlu mu?
```
