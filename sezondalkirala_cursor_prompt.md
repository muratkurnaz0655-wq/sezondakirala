# SezondalKirala.com — Cursor Agent Prompt (Güncel & Tam)

You are building **SezondalKirala.com** — a Turkish vacation rental platform for Fethiye.
V1 scope: Villa & boat listings, reservation system, package offers.

---

## Tech stack (do not deviate)
- Next.js 14 (App Router, TypeScript strict mode)
- Supabase (PostgreSQL, Auth, Storage)
- Tailwind CSS
- shadcn/ui components
- Resend (email notifications)
- iyzico (payment — implement as placeholder for now)

---

## Design system
- White background, blue (#0EA5E9) and green (#22C55E) accents
- Airbnb-style grid, large images, rounded cards
- Mobile-first responsive design

---

## Environment variables
The `.env.local` file is already created. Do NOT ask for credentials. Read them from process.env:

```
NEXT_PUBLIC_SUPABASE_URL=           # Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon public key
SUPABASE_SERVICE_ROLE_KEY=          # Supabase service_role key (server-side only)
NEXT_PUBLIC_SITE_URL=https://sezondalkirala.com
RESEND_API_KEY=                     # Resend API key
RESEND_FROM_EMAIL=noreply@sezondalkirala.com
```

**Critical**: Never use `SUPABASE_SERVICE_ROLE_KEY` in client components or expose it to the browser. Use only in Server Actions and API routes.

---

## Supabase client setup

Create two clients:

**`lib/supabase/client.ts`** — browser client (Client Components):
```ts
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`lib/supabase/server.ts`** — server client (Server Components, Server Actions, Route Handlers):
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
  )
}
```

**`lib/supabase/admin.ts`** — admin client with service role (Server Actions only, never in Client Components):
```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

Install required packages: `@supabase/ssr @supabase/supabase-js`

---

## Constants (`lib/constants.ts`)

```ts
export const TURSAB_NO = "14382"
export const WHATSAPP_NUMBER = "905XXXXXXXXX"  // replace with real number
export const SITE_NAME = "SezondalKirala"
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sezondalkirala.com"
export const STORAGE_BUCKET = "ilan-medyalari"  // Supabase Storage bucket name
export const ADMIN_PATH = "/yonetim"  // secret admin URL — do not link publicly
export const COMMISSION_RATE = 0.10  // %10 default, overridable from admin settings
```

---

## next.config.js — image domains

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}
module.exports = nextConfig
```

---

## TURSAB
TURSAB Belge No: `14382` (use `TURSAB_NO` constant everywhere — never hardcode)

Display in:
- Footer: "TURSAB Üyesidir — Belge No: 14382" with TURSAB logo placeholder (gray box 48x48)
- `/hakkimizda` page: dedicated trust section with TURSAB badge
- Reservation confirmation page (step 4): shown in booking summary
- All SEO landing pages (`/fethiye/villa-kiralama` etc.): in page footer area
- Mobile: always visible in footer, never hidden

---

## Database schema — Supabase tables (already created, DO NOT recreate)

```
kullanicilar: id, email, ad_soyad, telefon, rol (ziyaretci|ilan_sahibi|admin), avatar_url, olusturulma_tarihi
ilanlar: id, sahip_id, tip (villa|tekne), baslik, aciklama, slug, konum, gunluk_fiyat, temizlik_ucreti, kapasite, yatak_odasi, banyo, ozellikler (jsonb), aktif, sponsorlu, olusturulma_tarihi
ilan_medyalari: id, ilan_id, url, tip (resim|video), sira
musaitlik: id, ilan_id, tarih, durum (musait|dolu|ozel_fiyat), fiyat_override
sezon_fiyatlari: id, ilan_id, baslangic_tarihi, bitis_tarihi, gunluk_fiyat
paketler: id, baslik, kategori (macera|luks|romantik|aile), aciklama, sure_gun, kapasite, fiyat, ilan_idleri (jsonb), aktif
rezervasyonlar: id, kullanici_id, ilan_id, paket_id (nullable), giris_tarihi, cikis_tarihi, misafir_sayisi, toplam_fiyat, durum (beklemede|onaylandi|iptal), odeme_yontemi (kart|havale), referans_no, olusturulma_tarihi
yorumlar: id, rezervasyon_id, kullanici_id, ilan_id, puan, yorum, olusturulma_tarihi
mesajlar: id, gonderen_id, alici_id, ilan_id, icerik, okundu, olusturulma_tarihi
```

**Note on slug**: `ilanlar` table has a `slug` column. Generate slugs from `baslik` using Turkish-safe slugification (replace Turkish chars: ş→s, ğ→g, ü→u, ı→i, ö→o, ç→c, then lowercase + hyphenate). Create a `lib/utils/slug.ts` helper for this.

---

## Supabase RLS policies (already applied in Supabase — reference only, do NOT recreate)

```sql
-- ilanlar: public read of active listings, owner full access
-- rezervasyonlar: users see only their own, ilan_sahibi sees reservations for their ilanlar
-- yorumlar: public read, authenticated insert (only for completed rezervasyonlar)
-- mesajlar: gonderen and alici see their own messages
-- kullanicilar: users see only their own row, admin sees all
```

When writing queries, rely on RLS — do not add manual WHERE clauses for ownership checks in client-facing queries. Use `createAdminClient()` only when bypassing RLS is intentional (admin panel).

---

## Supabase Storage

Bucket name: **`ilan-medyalari`** (already created, public bucket)

Upload path pattern: `{ilan_id}/{timestamp}-{filename}`

Use `@supabase/storage-js` via the Supabase client:
```ts
const { data, error } = await supabase.storage
  .from(STORAGE_BUCKET)
  .upload(`${ilanId}/${Date.now()}-${file.name}`, file)
```

Public URL:
```ts
const { data: { publicUrl } } = supabase.storage
  .from(STORAGE_BUCKET)
  .getPublicUrl(path)
```

---

## TypeScript types (`types/supabase.ts`)

Generate types from Supabase using: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts`

If not available, define manually:
```ts
export type Ilan = {
  id: string
  sahip_id: string
  tip: 'villa' | 'tekne'
  baslik: string
  aciklama: string
  slug: string
  konum: string
  gunluk_fiyat: number
  temizlik_ucreti: number
  kapasite: number
  yatak_odasi: number
  banyo: number
  ozellikler: Record<string, boolean>
  aktif: boolean
  sponsorlu: boolean
  olusturulma_tarihi: string
}
// ... define all tables similarly
```

---

## Pages to build (in this exact order)

### Phase 1 — Foundation
1. **Supabase setup**: create `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts` as specified above. Create `lib/constants.ts`. Create `types/supabase.ts`.
2. **Auth pages**: `/giris`, `/kayit`, `/sifre-sifirla` — use Supabase Auth with `@supabase/ssr`. Use `createServerClient` in middleware for session refresh.
3. **Layout**: Header (logo, nav links, auth buttons showing user avatar if logged in), Footer (TURSAB badge with `TURSAB_NO` constant, links, copyright).
4. **Middleware** (`middleware.ts`): refresh Supabase session on every request, protect `/panel/*` and `/yonetim/*` routes.

### Phase 2 — Public pages
5. **Homepage** (`/`): Hero with Fethiye search form (giris_tarihi, cikis_tarihi, misafir_sayisi), vacation type selector (macera/luks/romantik/aile → filters paketler by kategori), featured paketler grid (max 4), featured ilanlar grid (max 6, aktif=true, sponsorlu first).
6. **Listings page** (`/konaklama`): filter sidebar (konum, fiyat aralığı, kapasite, yatak_odasi, ozellikler), responsive grid, pagination (12 per page). Filter only `tip='villa'` and `aktif=true`.
7. **Boats page** (`/tekneler`): same pattern as listings but `tip='tekne'`.
8. **Packages page** (`/paketler`): card grid with category filter tabs (tümü/macera/luks/romantik/aile). Only show `aktif=true` paketler.
9. **Listing detail** (`/konaklama/[slug]` and `/tekneler/[slug]`): query `ilanlar` by `slug` column. Photo gallery (lightbox), map (use `react-leaflet` — dynamic import with `ssr: false`), dynamic price calculator (base price + cleaning fee + sezon_fiyatlari override), availability calendar (use `react-day-picker`, block `musaitlik` dates where `durum='dolu'`), WhatsApp sticky button (`href="https://wa.me/${WHATSAPP_NUMBER}"`), reviews section (yorumlar with puan average), similar listings (same tip, same konum).
10. **`/hakkimizda`**: about page with team, story, TURSAB trust section (badge + `TURSAB_NO`).
11. **`/sss`**: FAQ accordion using shadcn/ui Accordion.
12. **SEO pages**: `/fethiye/villa-kiralama`, `/fethiye/tekne-kiralama` — static pages, generateMetadata with Turkish SEO keywords, TURSAB number in footer area. Add JSON-LD schema markup.

### Phase 3 — Reservation flow
13. **`/rezervasyon/[id]`**: 4-step wizard (use URL params for step: `?adim=1`)
    - Step 1 (Özet): giris_tarihi, cikis_tarihi, misafir_sayisi, fiyat breakdown (günlük × gün + temizlik = toplam)
    - Step 2 (Bilgiler): ad_soyad, telefon, email form (react-hook-form + zod)
    - Step 3 (Ödeme): kart/havale radio, iyzico placeholder UI with fake card form
    - Step 4 (Onay): referans_no (generate: `SZK-${Date.now()}`), TURSAB badge, trigger confirmation email via Resend

### Phase 4 — User panels
14. **`/panel/rezervasyonlar`**: reservation history table with durum badge (beklemede=yellow, onaylandi=green, iptal=red), cancel button for beklemede.
15. **`/panel/favoriler`**: saved ilanlar (store favorites in localStorage or add `favoriler` table if needed).
16. **`/panel/mesajlar`**: simple inbox/outbox UI, real-time optional (polling every 30s is fine).
17. **`/panel/profil`**: edit ad_soyad, telefon, avatar upload to Supabase Storage.

### Phase 5 — Owner panel
18. **`/panel/ilanlarim`**: ilan list with aktif toggle, edit/delete actions. Only show ilanlar where `sahip_id = auth.uid()`.
19. **`/panel/ilanlarim/yeni`**: 4-step ilan creation wizard:
    - Step 1: Temel bilgiler (baslik, aciklama, tip, konum, kapasite, yatak_odasi, banyo)
    - Step 2: Medya upload (drag & drop, upload to `ilan-medyalari` bucket, reorder by sira)
    - Step 3: Konum & özellikler (Leaflet map pin, ozellikler checkboxes: wifi, havuz, klima, etc.)
    - Step 4: Fiyat & takvim (gunluk_fiyat, temizlik_ucreti, sezon_fiyatlari date ranges)
20. **`/panel/takvim`**: availability calendar with color-coded dates (yeşil=musait, kırmızı=dolu, sarı=ozel_fiyat). Use `react-day-picker` with custom modifiers.
21. **`/panel/fiyat`**: sezon_fiyatlari management — add/edit/delete date ranges with daily price override.
22. **`/panel/talepler`**: incoming reservation requests, approve/reject buttons that update `rezervasyonlar.durum`.

### Phase 6 — Admin panel (route: `/yonetim`)
23. **`/yonetim`**: dashboard — total ilanlar, rezervasyonlar, kullanicilar counts. Recent activity list.
24. **`/yonetim/giris`**: separate admin login page (check `rol='admin'` after login).
25. **`/yonetim/ilanlar`**: all ilanlar, approve (`aktif=true`) / reject with reason, delete.
26. **`/yonetim/paketler`**: create paketler by combining ilanlar (multi-select ilan picker, save ilan_idleri as jsonb array).
27. **`/yonetim/kullanicilar`**: list all kullanicilar, change rol, deactivate.
28. **`/yonetim/rezervasyonlar`**: all rezervasyonlar with filters by durum/tarih.
29. **`/yonetim/ayarlar`**: platform settings — komisyon_orani input, TURSAB_NO editable field (save to a `ayarlar` table or env), WhatsApp number.

**Admin route guard**: In `middleware.ts`, redirect `/yonetim/*` to `/yonetim/giris` if user is not authenticated OR `rol !== 'admin'`.

---

## Email notifications (Resend)

Use `resend.emails.send()` in Server Actions. Always include in email footer: `"TURSAB Belge No: ${TURSAB_NO}"`

Trigger emails for:
- `kayit-onay`: after successful signup
- `rezervasyon-onay`: when `durum` changes to `onaylandi`
- `rezervasyon-iptal`: when `durum` changes to `iptal`
- `yeni-talep`: to ilan_sahibi when new rezervasyon created for their ilan
- `tatil-hatirlatma`: 3 days before `giris_tarihi` (can be cron or triggered on creation)
- `yorum-istegi`: day after `cikis_tarihi`
- `ilan-onay`: when admin approves an ilan
- `ilan-red`: when admin rejects an ilan (include reason)

Create email templates in `emails/` directory using React Email or plain HTML strings.

---

## Important implementation notes

- **Server Components by default**, Client Components (`'use client'`) only when needed (forms, maps, calendars, interactive state)
- **All forms**: `react-hook-form` + `zod` validation
- **Images**: `next/image` with Supabase Storage URLs (domain configured in next.config.js)
- **Calendar**: `react-day-picker`
- **Map**: `react-leaflet` with dynamic import `{ ssr: false }` — never SSR Leaflet
- **WhatsApp button**: sticky on mobile (`fixed bottom-4 right-4 z-50`), visible on all listing detail pages, uses `WHATSAPP_NUMBER` constant
- **Turkish language** throughout (tr locale). Variable names in code: English. Database column names: Turkish (as defined). UI text: Turkish.
- **Currency**: Turkish Lira (₺), format with `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })`
- **Date format**: Turkish locale `dd MMMM yyyy` using `date-fns/tr`
- **Error handling**: all Server Actions return `{ success: boolean, error?: string }`, show toast notifications (shadcn/ui Toast)
- **Loading states**: use Suspense + skeleton components for data-fetching Server Components

---

## Seed data (already in Supabase — DO NOT insert)
- `ilanlar`: 6 villa (`tip='villa'`), 3 tekne (`tip='tekne'`), all have `slug` values
- `paketler`: 4 rows, kategori = `macera`, `luks`, `romantik`, `aile`
- `rezervasyonlar`: mixed `durum` values
- `kullanicilar`: includes rows with `rol = 'admin'`, `'ilan_sahibi'`, `'ziyaretci'`

---

## Start here
Do the following in order:
1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"`
2. Install dependencies: `npm install @supabase/ssr @supabase/supabase-js react-hook-form zod @hookform/resolvers resend react-day-picker react-leaflet leaflet date-fns`
3. Install shadcn/ui: `npx shadcn-ui@latest init`
4. Create `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
5. Create `lib/constants.ts`
6. Create `middleware.ts` for session management and route protection
7. Proceed with Phase 1 auth pages
