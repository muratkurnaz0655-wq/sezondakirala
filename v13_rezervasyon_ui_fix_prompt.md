# SezondalKirala — Rezervasyon Kayıt & Tasarım Promptu

---

## BÖLÜM 1 — REZERVASYON KAYDEDİLMİYOR (KRİTİK)

### 1.1 Sorunu teşhis et

Rezervasyon oluşturulunca `rezervasyonlar` tablosuna kayıt gitmiyor. Şunları sırayla kontrol et:

```bash
# RezervasyonWizard bileşenini bul
grep -rn "rezervasyonlar" components/ app/ --include="*.tsx" --include="*.ts" | grep "insert\|from"
```

### 1.2 RLS Policy sorunu — büyük ihtimalle bu

Supabase'de `rezervasyonlar` tablosunda INSERT policy eksik olabilir. Supabase SQL Editor'da çalıştır:

```sql
-- Mevcut policy'leri gör
SELECT * FROM pg_policies WHERE tablename = 'rezervasyonlar';

-- INSERT policy yoksa ekle:
CREATE POLICY "kullanici_rezervasyon_olusturabilir" ON rezervasyonlar
FOR INSERT WITH CHECK (auth.uid() = kullanici_id);

-- SELECT policy yoksa ekle:
CREATE POLICY "kullanici_kendi_rezervasyonlarini_gorur" ON rezervasyonlar
FOR SELECT USING (auth.uid() = kullanici_id);

-- UPDATE policy (durum değişikliği için):
CREATE POLICY "kullanici_kendi_rezervasyonunu_guncelleyebilir" ON rezervasyonlar
FOR UPDATE USING (auth.uid() = kullanici_id);
```

### 1.3 Supabase client kontrolü

`RezervasyonWizard.tsx` içinde hangi client kullanılıyor?

```tsx
// YANLIŞ — server client browser'da çalışmaz:
import { createClient } from '@/lib/supabase/server'

// DOĞRU — browser client kullan:
import { createClient } from '@/lib/supabase/client'
```

### 1.4 Insert hatasını yakala ve göster

```tsx
const rezervasyonOlustur = async () => {
  setKaydediliyor(true)
  setHata('')

  try {
    const supabase = createClient() // browser client

    // Önce kullanıcının oturumu var mı kontrol et
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      setHata('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.')
      setKaydediliyor(false)
      return
    }

    console.log('Rezervasyon oluşturuluyor...', {
      kullanici_id: user.id,
      ilan_id: ilan.id,
      giris_tarihi: girisTarihi,
      cikis_tarihi: cikisTarihi,
    })

    const { data, error } = await supabase
      .from('rezervasyonlar')
      .insert({
        kullanici_id: user.id,
        ilan_id: ilan.id,
        paket_id: null,
        giris_tarihi: girisTarihi,
        cikis_tarihi: cikisTarihi,
        misafir_sayisi: yetiskin + cocuk,
        toplam_fiyat: toplamFiyat,
        durum: 'beklemede',
        odeme_yontemi: odemeYontemi,
        referans_no: yeniReferansNo,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase hatası:', error)
      setHata(`Hata: ${error.message} (Kod: ${error.code})`)
      setKaydediliyor(false)
      return
    }

    console.log('Rezervasyon oluşturuldu:', data)
    setReferansNo(yeniReferansNo)
    setAktifAdim(4)

  } catch (e: any) {
    console.error('Beklenmeyen hata:', e)
    setHata('Beklenmeyen hata: ' + e.message)
  } finally {
    setKaydediliyor(false)
  }
}
```

### 1.5 Panel rezervasyonlar sayfası — RLS ile çek

```tsx
// app/panel/rezervasyonlar/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PanelRezervasyonlar() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris?redirect=/panel/rezervasyonlar')

  const { data: rezervasyonlar, error } = await supabase
    .from('rezervasyonlar')
    .select(`
      *,
      ilanlar (
        baslik,
        konum,
        tip,
        ilan_medyalari (url, sira)
      )
    `)
    .eq('kullanici_id', user.id)
    .order('olusturulma_tarihi', { ascending: false })

  if (error) console.error('Rezervasyon çekme hatası:', error)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rezervasyonlarım</h1>
      {!rezervasyonlar?.length ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">Henüz rezervasyonunuz yok</h3>
          <p className="text-gray-500 mb-6">İlk rezervasyonunuzu oluşturmak için villaları inceleyin</p>
          <a href="/konaklama" className="btn-primary">Villaları İncele</a>
        </div>
      ) : (
        <div className="space-y-4">
          {rezervasyonlar.map(rez => (
            <RezervasyonKarti key={rez.id} rezervasyon={rez} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### 1.6 Admin paneli rezervasyonlar — service role ile çek

```tsx
// app/yonetim/rezervasyonlar/page.tsx
import { createAdminDataClient } from '@/lib/supabase/admin-data'

export default async function AdminRezervasyonlar() {
  const supabase = createAdminDataClient() // RLS bypass

  const { data: rezervasyonlar } = await supabase
    .from('rezervasyonlar')
    .select(`
      *,
      kullanicilar (ad_soyad, email, telefon),
      ilanlar (baslik, konum)
    `)
    .order('olusturulma_tarihi', { ascending: false })

  // ...
}
```

---

## BÖLÜM 2 — REZERVASYON WIZARD TASARIMI — YENİDEN YAZ

### 2.1 Genel layout

```tsx
// app/rezervasyon/[id]/page.tsx içinde iki kolonlu layout:
<div className="min-h-screen bg-gray-50">
  {/* Üst bar */}
  <div className="bg-white border-b border-gray-100 px-4 py-4">
    <div className="max-w-5xl mx-auto flex items-center justify-between">
      <a href="/" className="font-bold text-sky-600 text-lg">SezondalKirala</a>
      {/* Adım progress bar */}
      <div className="flex items-center gap-2">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1.5 w-16 rounded-full transition-all
            ${aktifAdim >= i ? 'bg-sky-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="text-sm text-gray-500">Adım {aktifAdim} / 4</div>
    </div>
  </div>

  {/* İki kolon */}
  <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
    {/* Sol — form */}
    <div className="lg:col-span-2">
      {/* adım içeriği */}
    </div>
    {/* Sağ — özet kartı (sticky) */}
    <div className="lg:col-span-1">
      <OzetKarti ilan={ilan} ... />
    </div>
  </div>
</div>
```

### 2.2 Özet kartı (sağ taraf — sticky)

```tsx
function OzetKarti({ ilan, girisTarihi, cikisTarihi, yetiskin, cocuk, toplamFiyat, geceSayisi }) {
  const kapak = ilan.ilan_medyalari?.[0]?.url ?? 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-6 shadow-sm">
      {/* İlan görseli */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
        <Image src={kapak} alt={ilan.baslik} fill className="object-cover" />
      </div>

      {/* İlan bilgisi */}
      <div className="mb-4">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <MapPin size={11} /> {ilan.konum}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{ilan.baslik}</h3>
      </div>

      {/* Tarihler */}
      {girisTarihi && cikisTarihi && (
        <div className="border border-gray-200 rounded-xl p-3 mb-4">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="pr-3">
              <div className="text-xs text-gray-400 mb-0.5">Giriş</div>
              <div className="font-semibold text-sm text-gray-900">
                {format(new Date(girisTarihi), 'd MMM', { locale: tr })}
              </div>
            </div>
            <div className="pl-3">
              <div className="text-xs text-gray-400 mb-0.5">Çıkış</div>
              <div className="font-semibold text-sm text-gray-900">
                {format(new Date(cikisTarihi), 'd MMM', { locale: tr })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Misafir */}
      {yetiskin > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Users size={14} className="text-gray-400" />
          {yetiskin} yetişkin{cocuk > 0 ? `, ${cocuk} çocuk` : ''}
        </div>
      )}

      {/* Fiyat detayı */}
      {geceSayisi > 0 && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              ₺{ilan.gunluk_fiyat?.toLocaleString('tr-TR')} × {geceSayisi} gece
            </span>
            <span>₺{(ilan.gunluk_fiyat * geceSayisi).toLocaleString('tr-TR')}</span>
          </div>
          {ilan.temizlik_ucreti > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Temizlik ücreti</span>
              <span>₺{ilan.temizlik_ucreti?.toLocaleString('tr-TR')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
            <span>Toplam</span>
            <span className="text-sky-600">₺{toplamFiyat?.toLocaleString('tr-TR')}</span>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">
            Henüz ücret alınmadı
          </p>
        </div>
      )}

      {/* TURSAB */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2
        text-xs text-gray-400 justify-center">
        <Shield size={12} />
        TURSAB Belgeli — No: {TURSAB_NO}
      </div>
    </div>
  )
}
```

### 2.3 Adım 1 — Detaylar (temiz tasarım)

```tsx
{aktifAdim === 1 && (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-1">Tarihleri Seçin</h2>
    <p className="text-gray-500 text-sm mb-6">Giriş ve çıkış tarihlerinizi belirleyin</p>

    {/* Tarih seçici — Airbnb tarzı */}
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase
          tracking-wider mb-2">Giriş Tarihi</label>
        <div className={`border-2 rounded-xl px-4 py-3 cursor-pointer transition-all
          ${girisTarihi ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}
          onClick={() => setAcikTakvim('giris')}>
          <div className="text-xs text-gray-400 mb-0.5">GİRİŞ</div>
          <div className={`font-semibold ${girisTarihi ? 'text-sky-700' : 'text-gray-400'}`}>
            {girisTarihi
              ? format(new Date(girisTarihi), 'd MMM yyyy', { locale: tr })
              : 'Tarih ekle'}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase
          tracking-wider mb-2">Çıkış Tarihi</label>
        <div className={`border-2 rounded-xl px-4 py-3 cursor-pointer transition-all
          ${cikisTarihi ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}
          onClick={() => setAcikTakvim('cikis')}>
          <div className="text-xs text-gray-400 mb-0.5">ÇIKIŞ</div>
          <div className={`font-semibold ${cikisTarihi ? 'text-sky-700' : 'text-gray-400'}`}>
            {cikisTarihi
              ? format(new Date(cikisTarihi), 'd MMM yyyy', { locale: tr })
              : 'Tarih ekle'}
          </div>
        </div>
      </div>
    </div>

    {/* Misafir sayısı */}
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase
        tracking-wider mb-3">Misafirler</label>
      <div className="space-y-3">
        {[
          { label: 'Yetişkin', desc: '13 yaş ve üzeri', val: yetiskin, set: setYetiskin, min: 1, max: 20 },
          { label: 'Çocuk', desc: '2–12 yaş', val: cocuk, set: setCocuk, min: 0, max: 10 },
          { label: 'Bebek', desc: '0–2 yaş', val: bebek, set: setBebek, min: 0, max: 5 },
        ].map(({ label, desc, val, set, min, max }) => (
          <div key={label} className="flex items-center justify-between py-3
            border-b border-gray-100 last:border-0">
            <div>
              <div className="font-medium text-gray-900 text-sm">{label}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => set(Math.max(min, val - 1))}
                disabled={val <= min}
                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center
                  justify-center text-gray-600 hover:border-gray-400 disabled:opacity-30
                  disabled:cursor-not-allowed transition-colors font-bold">
                −
              </button>
              <span className="w-6 text-center font-bold text-gray-900">{val}</span>
              <button type="button"
                onClick={() => set(Math.min(max, val + 1))}
                disabled={val >= max}
                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center
                  justify-center text-gray-600 hover:border-gray-400 disabled:opacity-30
                  disabled:cursor-not-allowed transition-colors font-bold">
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

### 2.4 Adım 2 — Kişisel Bilgiler

```tsx
{aktifAdim === 2 && (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-1">Kişisel Bilgiler</h2>
    <p className="text-gray-500 text-sm mb-6">
      Rezervasyon için iletişim bilgileriniz gereklidir
    </p>

    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad *</label>
          <input type="text" placeholder="Adınız"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
              focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Soyad *</label>
          <input type="text" placeholder="Soyadınız"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
              focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta *</label>
        <input type="email" placeholder="ornek@email.com"
          defaultValue={user?.email}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
            focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        <p className="text-xs text-gray-400 mt-1">Onay e-postası bu adrese gönderilecek</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon *</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 border border-r-0 border-gray-200
            rounded-l-xl bg-gray-50 text-gray-500 text-sm">🇹🇷 +90</span>
          <input type="tel" placeholder="5XX XXX XX XX"
            className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm
              focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Özel İstek <span className="text-gray-400 font-normal">(opsiyonel)</span>
        </label>
        <textarea rows={3} placeholder="Erken giriş, özel dilek, doğum günü vb."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
            focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100
            resize-none" />
      </div>
    </div>
  </div>
)}
```

### 2.5 Adım 3 — Ödeme

```tsx
{aktifAdim === 3 && (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-1">Ödeme</h2>
    <p className="text-gray-500 text-sm mb-6">Güvenli ödeme yönteminizi seçin</p>

    <div className="space-y-3 mb-6">
      {[
        {
          val: 'kart',
          baslik: 'Kredi / Banka Kartı',
          aciklama: 'Visa, Mastercard, Troy',
          ikon: '💳',
        },
        {
          val: 'havale',
          baslik: 'Havale / EFT',
          aciklama: 'Banka transferiyle güvenli ödeme',
          ikon: '🏦',
        },
      ].map(({ val, baslik, aciklama, ikon }) => (
        <label key={val}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer
            transition-all ${odemeYontemi === val
              ? 'border-sky-500 bg-sky-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
          <input type="radio" name="odeme" value={val}
            checked={odemeYontemi === val}
            onChange={() => setOdemeYontemi(val)}
            className="accent-sky-500 w-4 h-4" />
          <span className="text-2xl">{ikon}</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 text-sm">{baslik}</div>
            <div className="text-xs text-gray-500 mt-0.5">{aciklama}</div>
          </div>
          {odemeYontemi === val && (
            <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center
              justify-center flex-shrink-0">
              <Check size={12} className="text-white" />
            </div>
          )}
        </label>
      ))}
    </div>

    {odemeYontemi === 'havale' && (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <div className="font-semibold text-amber-800 mb-3 text-sm">Havale Bilgileri</div>
        <div className="space-y-2 text-sm text-amber-700">
          <div className="flex justify-between">
            <span className="text-amber-600">Banka</span>
            <span className="font-medium">Garanti BBVA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-600">IBAN</span>
            <span className="font-medium font-mono">TR00 0000 0000 0000 0000 00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-600">Hesap Adı</span>
            <span className="font-medium">SezondalKirala</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-600">
          ⚠️ Açıklama kısmına referans numaranızı yazmayı unutmayın
        </div>
      </div>
    )}

    {/* Güven rozetleri */}
    <div className="grid grid-cols-3 gap-3 mt-4">
      {[
        { ikon: '🔒', baslik: 'SSL Güvenli', aciklama: '256-bit şifreleme' },
        { ikon: '✅', baslik: 'TURSAB', aciklama: `Belge No: ${TURSAB_NO}` },
        { ikon: '💯', baslik: 'Güvenli', aciklama: 'İade garantisi' },
      ].map(({ ikon, baslik, aciklama }) => (
        <div key={baslik} className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-xl mb-1">{ikon}</div>
          <div className="font-semibold text-gray-900 text-xs">{baslik}</div>
          <div className="text-gray-400 text-xs mt-0.5">{aciklama}</div>
        </div>
      ))}
    </div>
  </div>
)}
```

### 2.6 Adım 4 — Onay sayfası

```tsx
{aktifAdim === 4 && (
  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
    {/* Animasyonlu tik */}
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center
      justify-center mx-auto mb-6 animate-bounce">
      <Check size={36} className="text-green-600" />
    </div>

    <h2 className="text-2xl font-bold text-gray-900 mb-2">
      Rezervasyonunuz Alındı! 🎉
    </h2>
    <p className="text-gray-500 mb-8">
      En kısa sürede sizi arayarak rezervasyonunuzu onaylayacağız.
    </p>

    {/* Referans no */}
    <div className="bg-sky-50 border-2 border-sky-200 border-dashed rounded-2xl p-5 mb-6">
      <div className="text-xs text-sky-600 font-semibold uppercase tracking-wider mb-1">
        Referans Numaranız
      </div>
      <div className="text-3xl font-black text-sky-700 tracking-wider">{referansNo}</div>
      <div className="text-xs text-sky-500 mt-2">Bu numarayı kaydedin</div>
    </div>

    {/* Detay tablosu */}
    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
      <div className="font-semibold text-gray-900 mb-3">📋 Rezervasyon Detayları</div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">İlan</span>
          <span className="font-medium text-gray-900">{ilan.baslik}</span>
        </div>
        {girisTarihi && (
          <div className="flex justify-between">
            <span className="text-gray-500">Giriş</span>
            <span className="font-medium">
              {format(new Date(girisTarihi), 'd MMMM yyyy', { locale: tr })}
            </span>
          </div>
        )}
        {cikisTarihi && (
          <div className="flex justify-between">
            <span className="text-gray-500">Çıkış</span>
            <span className="font-medium">
              {format(new Date(cikisTarihi), 'd MMMM yyyy', { locale: tr })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Misafir</span>
          <span className="font-medium">
            {yetiskin} yetişkin{cocuk > 0 ? `, ${cocuk} çocuk` : ''}
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
          <span className="font-bold text-gray-900">Toplam</span>
          <span className="font-bold text-sky-600 text-base">
            ₺{toplamFiyat?.toLocaleString('tr-TR')}
          </span>
        </div>
      </div>
    </div>

    <div className="text-xs text-gray-400 mb-6">
      TURSAB Üyesidir — Belge No: {TURSAB_NO}
    </div>

    {/* Butonlar */}
    <div className="flex flex-col sm:flex-row gap-3">
      <a href="/panel/rezervasyonlar"
        className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold
          text-gray-700 text-sm text-center hover:bg-gray-50 transition-colors">
        📅 Rezervasyonlarım
      </a>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Merhaba, ${referansNo} referans numaralı rezervasyonum hakkında bilgi almak istiyorum.`)}`}
        target="_blank"
        className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600
          text-white font-semibold text-sm text-center transition-colors">
        💬 WhatsApp İletişim
      </a>
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

Test:
1. Supabase SQL Editor'da rezervasyonlar tablosunda INSERT ve SELECT policy var mı?
2. Rezervasyon wizard'ı 4 adımı tamamla → Supabase'de kayıt oluştu mu?
3. /panel/rezervasyonlar sayfasında rezervasyon görünüyor mu?
4. /yonetim/rezervasyonlar sayfasında görünüyor mu?
5. Wizard tasarımı iki kolonlu mu, özet kartı sağda mı?
