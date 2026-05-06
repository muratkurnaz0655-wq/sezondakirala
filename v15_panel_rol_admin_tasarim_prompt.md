# SezondalKirala — V15 Panel Rol Ayrımı, Admin Ayarlar & Genel Tasarım

---

## BÖLÜM 1 — KULLANICI PANELİ ROL AYRIMI (KRİTİK)

### 1.1 Sorun
Tatilci olarak giriş yapan kullanıcı panelinde "İlanlarım", "Takvim Yönetimi", "Fiyat", "Gelen Talepler" menüleri görünüyor. Bu menüler sadece `ilan_sahibi` rolündeki kullanıcılara görünmeli.

### 1.2 Panel layout — role göre menü göster

```tsx
// app/panel/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PanelSidebar } from '@/components/panel/PanelSidebar'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?redirect=/panel')

  const { data: profil } = await supabase
    .from('kullanicilar')
    .select('rol, ad_soyad')
    .eq('id', user.id)
    .single()

  const rol = profil?.rol ?? 'ziyaretci'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <PanelSidebar rol={rol} adSoyad={profil?.ad_soyad} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
```

### 1.3 PanelSidebar — role göre menü

```tsx
// components/panel/PanelSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar, Heart, MessageCircle, User,
  Home, Clock, DollarSign, Bell, LogOut
} from 'lucide-react'

// Tatilci menüsü
const tatilciMenusu = [
  { href: '/panel/rezervasyonlar', label: 'Rezervasyonlarım', icon: Calendar },
  { href: '/panel/favoriler', label: 'Favorilerim', icon: Heart },
  { href: '/panel/mesajlar', label: 'Mesajlarım', icon: MessageCircle },
  { href: '/panel/profil', label: 'Profilim', icon: User },
]

// İlan sahibi menüsü — tatilci menüsü + ek menüler
const ilanSahibiMenusu = [
  { href: '/panel/rezervasyonlar', label: 'Rezervasyonlarım', icon: Calendar },
  { href: '/panel/ilanlarim', label: 'İlanlarım', icon: Home },
  { href: '/panel/talepler', label: 'Gelen Talepler', icon: Bell },
  { href: '/panel/takvim', label: 'Takvim Yönetimi', icon: Clock },
  { href: '/panel/fiyat', label: 'Fiyat Yönetimi', icon: DollarSign },
  { href: '/panel/favoriler', label: 'Favorilerim', icon: Heart },
  { href: '/panel/mesajlar', label: 'Mesajlarım', icon: MessageCircle },
  { href: '/panel/profil', label: 'Profilim', icon: User },
]

export function PanelSidebar({ rol, adSoyad }: { rol: string; adSoyad?: string }) {
  const pathname = usePathname()
  const menu = rol === 'ilan_sahibi' ? ilanSahibiMenusu : tatilciMenusu

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block">
      {/* Profil kartı */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600
            flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {adSoyad?.[0]?.toUpperCase() ?? 'K'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              {adSoyad ?? 'Kullanıcı'}
            </div>
            <div className={`text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full inline-block
              ${rol === 'ilan_sahibi'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-green-100 text-green-700'}`}>
              {rol === 'ilan_sahibi' ? '🏠 İlan Sahibi' : '🏖️ Tatilci'}
            </div>
          </div>
        </div>
      </div>

      {/* Menü */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* İlan sahibiyse özel başlık */}
        {rol === 'ilan_sahibi' && (
          <div className="px-4 py-2 bg-sky-50 border-b border-sky-100">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              İlan Yönetimi
            </p>
          </div>
        )}

        <nav className="p-2">
          {/* İlan sahibi ek menülerini ayır */}
          {rol === 'ilan_sahibi' && (
            <>
              {ilanSahibiMenusu.slice(1, 5).map(({ href, label, icon: Icon }) => {
                const aktif = pathname === href
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5
                      transition-all text-sm font-medium
                      ${aktif
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Icon size={16} className={aktif ? 'text-white' : 'text-gray-400'} />
                    {label}
                  </Link>
                )
              })}
              <div className="h-px bg-gray-100 my-2" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                Hesabım
              </p>
            </>
          )}

          {/* Ortak menüler */}
          {(rol === 'ilan_sahibi'
            ? ilanSahibiMenusu.slice(5)
            : tatilciMenusu
          ).map(({ href, label, icon: Icon }) => {
            const aktif = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5
                  transition-all text-sm font-medium
                  ${aktif
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Icon size={16} className={aktif ? 'text-white' : 'text-gray-400'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Çıkış */}
        <div className="p-2 border-t border-gray-100">
          <CikisButonu />
        </div>
      </div>

      {/* İlan sahibi değilse yükselt banner */}
      {rol === 'ziyaretci' && (
        <div className="mt-4 bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200
          rounded-2xl p-4">
          <div className="text-sm font-semibold text-sky-800 mb-1">🏠 Villanız var mı?</div>
          <p className="text-xs text-sky-600 mb-3">
            İlan sahibi hesabına geçerek villanızı kiraya verin
          </p>
          <Link href="/panel/profil?yukselt=true"
            className="block text-center py-2 rounded-xl bg-sky-500 text-white
              text-xs font-semibold hover:bg-sky-600 transition-colors">
            İlan Sahibi Ol
          </Link>
        </div>
      )}
    </aside>
  )
}
```

### 1.4 Header dropdown — role göre

```tsx
// components/UserDropdown.tsx — rol bazlı menü
{profil?.rol === 'ilan_sahibi' && (
  <>
    <DropdownItem href="/panel/ilanlarim" icon={Home}>İlanlarım</DropdownItem>
    <DropdownItem href="/panel/talepler" icon={Bell}>Gelen Talepler</DropdownItem>
  </>
)}
<DropdownItem href="/panel/rezervasyonlar" icon={Calendar}>Rezervasyonlarım</DropdownItem>
<DropdownItem href="/panel/favoriler" icon={Heart}>Favorilerim</DropdownItem>
<DropdownItem href="/panel/profil" icon={User}>Profilim</DropdownItem>
```

### 1.5 Rol yükseltme — /panel/profil?yukselt=true

```tsx
// Tatilci hesabını ilan sahibine çevir butonu
const rolYukselt = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  await supabase
    .from('kullanicilar')
    .update({ rol: 'ilan_sahibi' })
    .eq('id', user!.id)
  router.refresh()
}
```

---

## BÖLÜM 2 — ADMIN AYARLAR SAYFASI — KAYDETME ÇALIŞMIYOR

### 2.1 Sorun
`/yonetim/ayarlar` sayfasında değişiklikler kaydedilmiyor. Büyük ihtimalle:
- `ayarlar` tablosuna yazma yetkisi yok
- Form submit handler yanlış çalışıyor
- `createAdminDataClient()` yerine yanlış client kullanılıyor

### 2.2 Ayarlar Server Action

```tsx
// app/yonetim/ayarlar/actions.ts
'use server'
import { createAdminDataClient } from '@/lib/supabase/admin-data'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function ayarlariKaydet(formData: FormData) {
  // Admin kontrolü
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')
  if (!adminSession) throw new Error('Yetkisiz erişim')

  const supabase = createAdminDataClient() // service role — RLS bypass

  const yeniAyarlar = {
    tursab_no: formData.get('tursab_no') as string,
    whatsapp_number: formData.get('whatsapp_number') as string,
    komisyon_orani: Number(formData.get('komisyon_orani')) / 100,
    iletisim_email: formData.get('iletisim_email') as string,
    iletisim_telefon: formData.get('iletisim_telefon') as string,
    site_slogan: formData.get('site_slogan') as string,
  }

  // Önce mevcut kayıt var mı?
  const { data: mevcut } = await supabase
    .from('ayarlar')
    .select('id')
    .limit(1)
    .single()

  let hata
  if (mevcut) {
    const { error } = await supabase
      .from('ayarlar')
      .update(yeniAyarlar)
      .eq('id', mevcut.id)
    hata = error
  } else {
    const { error } = await supabase
      .from('ayarlar')
      .insert(yeniAyarlar)
    hata = error
  }

  if (hata) {
    console.error('Ayar kaydetme hatası:', hata)
    return { basarili: false, mesaj: hata.message }
  }

  revalidatePath('/yonetim/ayarlar')
  return { basarili: true, mesaj: 'Ayarlar başarıyla kaydedildi' }
}
```

### 2.3 Ayarlar sayfası formu

```tsx
// app/yonetim/ayarlar/page.tsx
import { createAdminDataClient } from '@/lib/supabase/admin-data'
import { AyarlarForm } from './AyarlarForm'

export default async function AdminAyarlar() {
  const supabase = createAdminDataClient()
  const { data: ayarlar } = await supabase
    .from('ayarlar')
    .select('*')
    .limit(1)
    .single()

  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-6">Platform Ayarları</h1>
      <AyarlarForm mevcutAyarlar={ayarlar} />
    </div>
  )
}
```

```tsx
// app/yonetim/ayarlar/AyarlarForm.tsx
'use client'
import { useState } from 'react'
import { ayarlariKaydet } from './actions'

export function AyarlarForm({ mevcutAyarlar }) {
  const [mesaj, setMesaj] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setYukleniyor(true)
    setMesaj('')

    const formData = new FormData(e.currentTarget)
    const sonuc = await ayarlariKaydet(formData)

    setMesaj(sonuc.mesaj)
    setYukleniyor(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">

        {/* İletişim */}
        <div className="admin-card">
          <h3 className="text-white font-semibold mb-4">📞 İletişim Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">WhatsApp Numarası</label>
              <input name="whatsapp_number" className="admin-input"
                defaultValue={mevcutAyarlar?.whatsapp_number ?? ''}
                placeholder="905XXXXXXXXX" />
            </div>
            <div>
              <label className="admin-label">İletişim Telefonu</label>
              <input name="iletisim_telefon" className="admin-input"
                defaultValue={mevcutAyarlar?.iletisim_telefon ?? ''}
                placeholder="+90 5XX XXX XX XX" />
            </div>
            <div className="col-span-2">
              <label className="admin-label">İletişim E-postası</label>
              <input name="iletisim_email" className="admin-input"
                defaultValue={mevcutAyarlar?.iletisim_email ?? ''}
                placeholder="info@sezondakirala.com" />
            </div>
          </div>
        </div>

        {/* TURSAB & Komisyon */}
        <div className="admin-card">
          <h3 className="text-white font-semibold mb-4">🏆 Platform Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">TURSAB Belge No</label>
              <input name="tursab_no" className="admin-input"
                defaultValue={mevcutAyarlar?.tursab_no ?? '14382'} />
            </div>
            <div>
              <label className="admin-label">Komisyon Oranı (%)</label>
              <input name="komisyon_orani" type="number" min="0" max="100"
                className="admin-input"
                defaultValue={Math.round((mevcutAyarlar?.komisyon_orani ?? 0.1) * 100)} />
            </div>
            <div className="col-span-2">
              <label className="admin-label">Site Sloganı</label>
              <input name="site_slogan" className="admin-input"
                defaultValue={mevcutAyarlar?.site_slogan ?? ''}
                placeholder="Fethiye'nin en güvenilir villa platformu" />
            </div>
          </div>
        </div>

        {/* Kaydet */}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={yukleniyor}
            className="admin-btn admin-btn-primary px-6 py-3 disabled:opacity-50">
            {yukleniyor ? 'Kaydediliyor...' : '💾 Ayarları Kaydet'}
          </button>
          {mesaj && (
            <span className={`text-sm font-medium ${
              mesaj.includes('başarı') ? 'text-green-400' : 'text-red-400'
            }`}>
              {mesaj.includes('başarı') ? '✅' : '❌'} {mesaj}
            </span>
          )}
        </div>
      </div>
    </form>
  )
}
```

### 2.4 Supabase'de ayarlar tablosu RLS

```sql
-- Supabase SQL Editor'da çalıştır:
-- ayarlar tablosuna service role erişimi için policy
ALTER TABLE ayarlar ENABLE ROW LEVEL SECURITY;

-- Service role her şeyi yapabilir (createAdminDataClient kullandığımız için bu yeterli)
-- Ek olarak authenticated user okuyabilsin:
CREATE POLICY "herkes_ayarlari_okuyabilir" ON ayarlar
FOR SELECT USING (true);
```

---

## BÖLÜM 3 — GENEL TASARIM — TATİL SİTESİ HİSSİ

### 3.1 Renk ve gradient sistemi — canlı ve tatil temalı

```css
/* globals.css — ek stiller */

/* Ana gradient — mavi-yeşil okyanus hissi */
.gradient-ocean {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #22c55e 100%);
}

/* Sıcak tatil gradient — gün batımı */
.gradient-sunset {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%);
}

/* Bölüm arka planları — daha canlı */
.section-ocean { background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%); }
.section-nature { background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%); }
.section-warm { background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); }
.section-dark { background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); }
```

### 3.2 Buton sistemi — daha canlı

```css
/* Birincil buton — okyanus gradient */
.btn-primary {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  border-radius: 14px;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.01em;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5);
}
.btn-primary:active { transform: translateY(0); }

/* WhatsApp butonu */
.btn-whatsapp {
  background: linear-gradient(135deg, #25d366, #128c7e);
  color: white;
  border-radius: 14px;
  padding: 12px 24px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.35);
  transition: all 0.25s;
}
.btn-whatsapp:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(37, 211, 102, 0.5);
}

/* CTA butonu — gradient border */
.btn-outline-gradient {
  background: white;
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  border-radius: 14px;
  padding: 11px 24px;
  font-weight: 700;
  color: #0ea5e9;
  cursor: pointer;
  transition: all 0.25s;
}
.btn-outline-gradient::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0ea5e9, #22c55e);
  z-index: -1;
}
.btn-outline-gradient:hover {
  background: linear-gradient(135deg, #0ea5e9, #22c55e);
  color: white;
}
```

### 3.3 Kart tasarımı — dalga efekti

```css
/* Villa kartı — tatil hissi */
.villa-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.villa-card:hover {
  box-shadow: 0 20px 60px rgba(14, 165, 233, 0.15);
  transform: translateY(-8px);
  border-color: rgba(14, 165, 233, 0.2);
}

/* Paket kartı — premium his */
.paket-card {
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  transition: all 0.4s;
}
.paket-card:hover {
  box-shadow: 0 20px 60px rgba(34, 197, 94, 0.15);
  transform: translateY(-8px);
}
```

### 3.4 Ana sayfa section'ları — tatil hissi

```tsx
// "Neden SezondalKirala" section — okyanus mavi
<section style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)' }}>
  {/* beyaz ikonlar ve metin */}
</section>

// "Nasıl Çalışır" section — yeşil doğa hissi  
<section style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
  {/* mavi/yeşil adım numaraları */}
</section>

// "Fethiye'yi Keşfedin" section — koyu, dramatik
<section style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
  {/* beyaz metin, parlak bölge kartları */}
</section>

// CTA section — gün batımı gradient
<section style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 40%, #22c55e 100%)' }}>
  {/* beyaz metin ve butonlar */}
</section>
```

### 3.5 Badge ve etiket sistemi

```css
/* Kategori badge'leri — canlı renkler */
.badge-macera { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
.badge-luks { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
.badge-romantik { background: linear-gradient(135deg, #ec4899, #db2777); color: white; }
.badge-aile { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
.badge-one-cikan { background: linear-gradient(135deg, #f59e0b, #f97316); color: white; }

/* Durum badge'leri */
.badge-musait { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.badge-dolu { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.badge-beklemede { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.badge-onaylandi { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
```

### 3.6 İkon sistemi — tatil temalı

Tüm emoji ikonlarını lucide-react ile değiştir. Tatil temalı ikonlar:
```tsx
import {
  Waves,        // Deniz, tekne
  Sun,          // Güneş, yaz
  Palmtree,     // Tatil, tropikal  
  Anchor,       // Tekne, marina
  Compass,      // Keşif, macera
  Star,         // Değerlendirme, öne çıkan
  Sparkles,     // Lüks, premium
  Heart,        // Favori, romantik
  Users,        // Aile, grup
  Shield,       // Güven, TURSAB
  MapPin,       // Konum
  Calendar,     // Tarih
  Clock,        // Süre
  Bed,          // Yatak odası
  Bath,         // Banyo
  Wifi,         // WiFi
  Flame,        // BBQ
  Car,          // Otopark
  TreePine,     // Bahçe, doğa
} from 'lucide-react'
```

### 3.7 Wave divider — bölümler arası

```tsx
// components/WaveDivider.tsx
export function WaveDivider({ 
  topColor = '#ffffff', 
  bottomColor = '#f0f9ff',
  flip = false 
}: { 
  topColor?: string
  bottomColor?: string
  flip?: boolean
}) {
  return (
    <div style={{ 
      background: topColor,
      transform: flip ? 'scaleY(-1)' : undefined,
      lineHeight: 0,
    }}>
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
        <path
          d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1380,20 1440,40 L1440,80 L0,80 Z"
          fill={bottomColor}
        />
      </svg>
    </div>
  )
}

// Kullanım — bölümler arası:
<WaveDivider topColor="#ffffff" bottomColor="#f0f9ff" />
<section style={{ background: '#f0f9ff' }}>...</section>
<WaveDivider topColor="#f0f9ff" bottomColor="#ffffff" flip />
```

### 3.8 Animasyonlar — tatil hissi

```css
/* globals.css */

/* Yüzen animasyon — hero rozeti, WhatsApp butonu */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
.animate-float { animation: float 3s ease-in-out infinite; }

/* Parlama — öne çıkan ilanlar */
@keyframes shimmer-gold {
  0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}
.animate-gold-pulse { animation: shimmer-gold 2s infinite; }

/* Dalga arka plan */
@keyframes wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Kart grid stagger */
.card-grid > *:nth-child(1) { animation-delay: 0ms; }
.card-grid > *:nth-child(2) { animation-delay: 100ms; }
.card-grid > *:nth-child(3) { animation-delay: 200ms; }
.card-grid > *:nth-child(4) { animation-delay: 300ms; }
.card-grid > *:nth-child(5) { animation-delay: 400ms; }
.card-grid > *:nth-child(6) { animation-delay: 500ms; }
```

---

## BÖLÜM 4 — PANEL SAYFASI GÖRSELLEŞTİRME

### 4.1 /panel ana sayfası — hoş geldin ekranı

```tsx
// app/panel/page.tsx
export default async function PanelAnaSayfa() {
  // ...user ve rezervasyon verilerini çek

  return (
    <div>
      {/* Hoş geldin kartı */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Merhaba, {adSoyad?.split(' ')[0]} 👋
            </h1>
            <p className="text-blue-100">
              {rol === 'ilan_sahibi'
                ? 'İlanlarınızı ve rezervasyonlarınızı buradan yönetin'
                : 'Rezervasyonlarınızı ve favorilerinizi buradan takip edin'}
            </p>
          </div>
          <div className="hidden md:block text-6xl opacity-20">🏖️</div>
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatKart baslik="Aktif Rezervasyon" deger={aktifRezCount} ikon="📅" renk="sky" />
        <StatKart baslik="Favori İlan" deger={favoriCount} ikon="❤️" renk="pink" />
        {rol === 'ilan_sahibi' && (
          <StatKart baslik="Aktif İlan" deger={ilanCount} ikon="🏠" renk="green" />
        )}
      </div>

      {/* Son rezervasyonlar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-4">Son Rezervasyonlarım</h2>
        {/* son 3 rezervasyon */}
      </div>
    </div>
  )
}
```

---

## SONUNDA

```bash
npm run build && npm run lint
npx vercel --prod
```

Test:
1. Tatilci olarak giriş yap → panel menüsünde İlanlarım/Takvim/Fiyat/Talepler görünmüyor mu?
2. İlan sahibi olarak giriş yap → bu menüler görünüyor mu?
3. Admin ayarlar → değişiklik yap → kaydet → Supabase'de güncellendi mi?
4. Sayfa bölümleri arası wave divider var mı?
5. Butonlar gradient ve hover efektli mi?
6. Kart hover'da yukarı kalkıp mavi glow mu görünüyor?
```
