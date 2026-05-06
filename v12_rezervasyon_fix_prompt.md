# SezondalKirala — Rezervasyon 404 & Takvim Düzeltme Promptu

Siteyi test ettim. İki kritik sorun var:

---

## SORUN 1 — Rezervasyon sayfası 404

"Rezervasyon Yap" butonu `/giris?redirect=/rezervasyon/10000000-0000-0000-0000-000000000001` adresine gidiyor. Giriş sonrası `/rezervasyon/[id]` sayfasına yönlendiriyor ama 404 veriyor.

### Adım 1 — Dosya var mı kontrol et

```bash
ls -la app/rezervasyon/
```

Eğer `app/rezervasyon/[id]/page.tsx` yoksa oluştur. Varsa içini gör ve neden 404 verdiğini bul.

### Adım 2 — app/rezervasyon/[id]/page.tsx oluştur

```tsx
// app/rezervasyon/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RezervasyonWizard } from '@/components/RezervasyonWizard'

export default async function RezervasyonSayfasi({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: Record<string, string>
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Giriş yapılmamışsa yönlendir
  if (!user) {
    const geri = encodeURIComponent(
      `/rezervasyon/${params.id}?${new URLSearchParams(searchParams).toString()}`
    )
    redirect(`/giris?redirect=${geri}`)
  }

  // Önce ilanlar tablosunda ara
  const { data: ilan } = await supabase
    .from('ilanlar')
    .select('*, ilan_medyalari(url, sira)')
    .eq('id', params.id)
    .single()

  // Bulunamazsa paketler tablosunda ara
  if (!ilan) {
    const { data: paket } = await supabase
      .from('paketler')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!paket) redirect('/')

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <RezervasyonWizard ilan={paket} isPaket user={user} searchParams={searchParams} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <RezervasyonWizard ilan={ilan} user={user} searchParams={searchParams} />
    </div>
  )
}
```

### Adım 3 — middleware.ts kontrolü

`/rezervasyon` route'u middleware'de yanlışlıkla engelleniyor olabilir. Kontrol et:

```ts
// middleware.ts — matcher'da /rezervasyon dahil mi?
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|videos|images|api).*)',
  ],
}
```

Ayrıca middleware içinde `/rezervasyon` adresini yanlışlıkla `/giris`'e yönlendiren bir kural var mı kontrol et. Olmaması lazım — `/panel` ve `/yonetim` korumalı, `/rezervasyon` herkese açık (giriş kontrolü sayfa içinde yapılıyor).

### Adım 4 — RezervasyonWizard bileşeni

`components/RezervasyonWizard.tsx` yoksa oluştur:

```tsx
// components/RezervasyonWizard.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TURSAB_NO, WHATSAPP_NUMBER } from '@/lib/constants'

const adimlar = ['Detaylar', 'Bilgiler', 'Ödeme', 'Onay']

export function RezervasyonWizard({ ilan, user, searchParams, isPaket = false }) {
  const router = useRouter()
  const supabase = createClient()

  const [aktifAdim, setAktifAdim] = useState(1)
  const [girisTarihi, setGirisTarihi] = useState(searchParams?.giris ?? '')
  const [cikisTarihi, setCikisTarihi] = useState(searchParams?.cikis ?? '')
  const [yetiskin, setYetiskin] = useState(Number(searchParams?.yetiskin ?? 2))
  const [cocuk, setCocuk] = useState(Number(searchParams?.cocuk ?? 0))
  const [adSoyad, setAdSoyad] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [ozelIstek, setOzelIstek] = useState('')
  const [odemeYontemi, setOdemeYontemi] = useState('')
  const [referansNo, setReferansNo] = useState('')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState('')

  // Gece sayısı ve fiyat hesaplama
  const geceSayisi = girisTarihi && cikisTarihi
    ? differenceInDays(new Date(cikisTarihi), new Date(girisTarihi))
    : 0

  const gunlukFiyat = ilan.gunluk_fiyat ?? ilan.fiyat ?? 0
  const temizlikUcreti = ilan.temizlik_ucreti ?? 0
  const toplamFiyat = isPaket
    ? gunlukFiyat
    : geceSayisi * gunlukFiyat + temizlikUcreti

  // Adım validasyonu
  const ileriBas = async () => {
    setHata('')

    if (aktifAdim === 1) {
      if (!girisTarihi) { setHata('Giriş tarihi seçiniz'); return }
      if (!cikisTarihi) { setHata('Çıkış tarihi seçiniz'); return }
      if (geceSayisi < 1) { setHata('Çıkış tarihi giriş tarihinden sonra olmalı'); return }
      if (yetiskin < 1) { setHata('En az 1 yetişkin gerekli'); return }
    }

    if (aktifAdim === 2) {
      if (!adSoyad.trim()) { setHata('Ad soyad zorunludur'); return }
      if (!telefon.trim()) { setHata('Telefon zorunludur'); return }
      if (!email.trim()) { setHata('E-posta zorunludur'); return }
    }

    if (aktifAdim === 3) {
      if (!odemeYontemi) { setHata('Ödeme yöntemi seçiniz'); return }
      await rezervasyonOlustur()
      return
    }

    setAktifAdim(prev => prev + 1)
  }

  const rezervasyonOlustur = async () => {
    setKaydediliyor(true)
    try {
      const yeniReferansNo = `SZK-${format(new Date(), 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`

      const { error } = await supabase.from('rezervasyonlar').insert({
        kullanici_id: user.id,
        ilan_id: isPaket ? null : ilan.id,
        paket_id: isPaket ? ilan.id : null,
        giris_tarihi: girisTarihi,
        cikis_tarihi: cikisTarihi,
        misafir_sayisi: yetiskin + cocuk,
        toplam_fiyat: toplamFiyat,
        durum: 'beklemede',
        odeme_yontemi: odemeYontemi,
        referans_no: yeniReferansNo,
      })

      if (error) throw error

      setReferansNo(yeniReferansNo)
      setAktifAdim(4)
    } catch (e: any) {
      setHata('Rezervasyon oluşturulurken hata: ' + e.message)
    } finally {
      setKaydediliyor(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Adım göstergesi */}
      <div className="flex items-center justify-center mb-8">
        {adimlar.map((adim, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full
              font-bold text-sm transition-all
              ${aktifAdim > i + 1 ? 'bg-green-500 text-white' :
                aktifAdim === i + 1 ? 'bg-sky-500 text-white' :
                'bg-gray-200 text-gray-400'}`}>
              {aktifAdim > i + 1 ? <Check size={16} /> : i + 1}
            </div>
            <span className={`hidden sm:block text-xs ml-1.5 mr-2 font-medium
              ${aktifAdim === i + 1 ? 'text-sky-600' : 'text-gray-400'}`}>
              {adim}
            </span>
            {i < 3 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-1
                ${aktifAdim > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Ana kart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">

        {/* ADIM 1 — Rezervasyon Detayları */}
        {aktifAdim === 1 && (
          <div>
            <h2 className="font-bold text-xl text-gray-900 mb-1">Rezervasyon Detayları</h2>
            <p className="text-gray-500 text-sm mb-6">{ilan.baslik}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                  Giriş Tarihi *
                </label>
                <input
                  type="date"
                  value={girisTarihi}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => setGirisTarihi(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                    focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                  Çıkış Tarihi *
                </label>
                <input
                  type="date"
                  value={cikisTarihi}
                  min={girisTarihi || format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => setCikisTarihi(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                    focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Misafir sayısı */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Yetişkin', altLabel: '13 yaş üzeri', val: yetiskin, set: setYetiskin, min: 1 },
                { label: 'Çocuk', altLabel: '2-12 yaş', val: cocuk, set: setCocuk, min: 0 },
              ].map(({ label, altLabel, val, set, min }) => (
                <div key={label} className="border border-gray-200 rounded-xl p-3">
                  <div className="font-medium text-gray-900 text-sm">{label}</div>
                  <div className="text-xs text-gray-400 mb-2">{altLabel}</div>
                  <div className="flex items-center justify-between">
                    <button type="button"
                      onClick={() => set(Math.max(min, val - 1))}
                      disabled={val <= min}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center
                        justify-center hover:border-sky-400 disabled:opacity-40 transition-colors">
                      −
                    </button>
                    <span className="font-bold text-lg">{val}</span>
                    <button type="button"
                      onClick={() => set(val + 1)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center
                        justify-center hover:border-sky-400 transition-colors">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Fiyat özeti */}
            {geceSayisi > 0 && !isPaket && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">
                    {geceSayisi} gece × ₺{gunlukFiyat.toLocaleString('tr-TR')}
                  </span>
                  <span className="font-medium">
                    ₺{(geceSayisi * gunlukFiyat).toLocaleString('tr-TR')}
                  </span>
                </div>
                {temizlikUcreti > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Temizlik ücreti</span>
                    <span className="font-medium">₺{temizlikUcreti.toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                  <span>Toplam</span>
                  <span className="text-sky-600">₺{toplamFiyat.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            )}

            {isPaket && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between font-bold">
                  <span>Paket Fiyatı</span>
                  <span className="text-sky-600">₺{gunlukFiyat.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADIM 2 — Kişisel Bilgiler */}
        {aktifAdim === 2 && (
          <div>
            <h2 className="font-bold text-xl text-gray-900 mb-6">Kişisel Bilgiler</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  value={adSoyad}
                  onChange={e => setAdSoyad(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={e => setTelefon(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                  E-posta *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                  Özel İstek (opsiyonel)
                </label>
                <textarea
                  value={ozelIstek}
                  onChange={e => setOzelIstek(e.target.value)}
                  placeholder="Erken giriş, özel dilek vb."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:border-sky-400 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ADIM 3 — Ödeme */}
        {aktifAdim === 3 && (
          <div>
            <h2 className="font-bold text-xl text-gray-900 mb-6">Ödeme Yöntemi</h2>

            <div className="space-y-3 mb-6">
              {[
                { val: 'kart', label: '💳 Kredi / Banka Kartı', desc: 'Güvenli online ödeme' },
                { val: 'havale', label: '🏦 Havale / EFT', desc: 'Banka havalesiyle ödeme' },
              ].map(({ val, label, desc }) => (
                <label key={val}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                    transition-all ${odemeYontemi === val
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="odeme"
                    value={val}
                    checked={odemeYontemi === val}
                    onChange={() => setOdemeYontemi(val)}
                    className="mt-0.5 accent-sky-500"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {odemeYontemi === 'havale' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                <div className="font-semibold text-blue-800 mb-2">Havale Bilgileri</div>
                <div className="text-blue-700 space-y-1">
                  <div>Banka: Garanti BBVA</div>
                  <div>IBAN: TR00 0000 0000 0000 0000 00</div>
                  <div>Hesap: SezondalKirala</div>
                </div>
              </div>
            )}

            {/* Fiyat özeti */}
            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <div className="font-semibold text-gray-900 mb-3">Rezervasyon Özeti</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>{ilan.baslik}</span>
                </div>
                {!isPaket && (
                  <div className="flex justify-between">
                    <span>{geceSayisi} gece</span>
                    <span>₺{(geceSayisi * gunlukFiyat).toLocaleString('tr-TR')}</span>
                  </div>
                )}
                {temizlikUcreti > 0 && (
                  <div className="flex justify-between">
                    <span>Temizlik</span>
                    <span>₺{temizlikUcreti.toLocaleString('tr-TR')}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
                <span>Toplam</span>
                <span className="text-sky-600">₺{toplamFiyat.toLocaleString('tr-TR')}</span>
              </div>
            </div>

            {/* Güven rozetleri */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
              <span>🔒 SSL Güvenli</span>
              <span>✅ TURSAB No: {TURSAB_NO}</span>
              <span>💯 Güvenli Platform</span>
            </div>
          </div>
        )}

        {/* ADIM 4 — Onay */}
        {aktifAdim === 4 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
              justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="font-bold text-2xl text-gray-900 mb-2">Rezervasyonunuz Alındı!</h2>
            <p className="text-gray-500 mb-6">
              En kısa sürede sizinle iletişime geçeceğiz.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="text-xs text-gray-500 mb-1">Referans Numaranız</div>
              <div className="font-bold text-xl text-sky-600">{referansNo}</div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6 text-sm text-left">
              <div className="font-semibold text-sky-800 mb-2">📋 Rezervasyon Detayları</div>
              <div className="text-sky-700 space-y-1">
                <div>{ilan.baslik}</div>
                {girisTarihi && <div>Giriş: {format(new Date(girisTarihi), 'd MMMM yyyy', { locale: tr })}</div>}
                {cikisTarihi && <div>Çıkış: {format(new Date(cikisTarihi), 'd MMMM yyyy', { locale: tr })}</div>}
                <div>{yetiskin} yetişkin{cocuk > 0 ? `, ${cocuk} çocuk` : ''}</div>
                <div className="font-semibold">Toplam: ₺{toplamFiyat.toLocaleString('tr-TR')}</div>
              </div>
            </div>

            <div className="text-xs text-gray-400 mb-6">
              TURSAB Üyesidir — Belge No: {TURSAB_NO}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/panel/rezervasyonlar')}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold
                  text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                Rezervasyonlarım
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Merhaba, ${referansNo} referans numaralı rezervasyonum hakkında bilgi almak istiyorum.`}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600
                  text-white font-semibold text-sm text-center transition-colors">
                WhatsApp İletişim
              </a>
            </div>
          </div>
        )}

        {/* Hata mesajı */}
        {hata && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl
            text-red-600 text-sm">
            {hata}
          </div>
        )}
      </div>

      {/* Navigasyon butonları */}
      {aktifAdim < 4 && (
        <div className="flex gap-3">
          {aktifAdim > 1 && (
            <button
              onClick={() => { setAktifAdim(prev => prev - 1); setHata('') }}
              className="flex items-center gap-1 px-5 py-3 rounded-xl border border-gray-200
                font-semibold text-gray-700 text-sm hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} /> Geri
            </button>
          )}
          <button
            onClick={ileriBas}
            disabled={kaydediliyor}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl
              bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm
              transition-colors disabled:opacity-60">
            {kaydediliyor ? 'İşleniyor...' :
              aktifAdim === 3 ? 'Rezervasyonu Tamamla' :
              <>Devam Et <ChevronRight size={16} /></>}
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## SORUN 2 — Takvimde fiyatlar birikim yapıyor

İlan detay sayfasındaki takvimde her günün üzerinde `10k, 24.5k, 34.5k, 44.5k...` gibi artan sayılar görünüyor. Bu birikim fiyatı, her günün sadece kendi gecelik fiyatını göstermeli.

```tsx
// Takvim custom day renderer'ını bul ve düzelt
// Şu an yanlış: her güne kadar olan toplam fiyat gösteriliyor
// Doğru: sadece o günün gecelik fiyatı gösterilmeli

// Düzeltme:
const gunFiyati = sezonFiyatlari?.[format(date, 'yyyy-MM-dd')] ?? ilan.gunluk_fiyat
// BU GÜNÜN fiyatı: örn 4.5k
const gosterim = `${(gunFiyati / 1000).toFixed(1)}k`

// YANLIŞ olan (birikim hesaplayan) kodu bul ve kaldır:
// Muhtemelen şöyle bir şey var: totalPrice += dailyPrice her gün için
// Bunu kaldır, sadece tek günün fiyatını göster
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test:
1. `/konaklama/10000000-0000-0000-0000-000000000001` sayfasına git
2. "Rezervasyon Yap"a tıkla → giriş sayfasına git → giriş yap
3. `/rezervasyon/10000000-...` sayfası açılıyor mu? (404 değil)
4. Tarih seç → devam et → kişisel bilgiler → ödeme → onay
5. Onay sayfasında referans numarası görünüyor mu?
6. Takvimde fiyatlar `4.5k` sabit mi? (Artmıyor)
