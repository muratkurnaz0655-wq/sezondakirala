# Admin Mobile QA Checklist

Date: 2026-05-08

## Scope

- `/yonetim` (Dashboard)
- `/yonetim/ilanlar`
- `/yonetim/ilanlar/yeni`
- `/yonetim/ilanlar/[id]/takvim`
- `/yonetim/paketler`
- `/yonetim/paketler/yeni`
- `/yonetim/paketler/[id]/takvim`
- `/yonetim/kullanicilar`
- `/yonetim/rezervasyonlar`
- `/yonetim/ayarlar`

## Checks

- [x] Mobile sidebar opens/closes correctly and does not lock page unexpectedly.
- [x] Topbar title does not overflow on small screens (truncate behavior).
- [x] List pages show mobile cards on small screens and desktop tables on `lg+`.
- [x] Action buttons wrap on mobile where row width is limited.
- [x] Filter forms stack correctly on mobile and controls remain tappable.
- [x] Segmented filter tabs remain horizontally scrollable on narrow widths.
- [x] Detail modals use viewport-safe wrappers (`max-h`, inner scroll regions).
- [x] No build-time regressions after responsive refactors.

## Fixes Applied During QA

- Converted topbar to compact support button + truncating title for narrow devices.
- Updated listing action row to wrap on mobile.
- Updated reservation mobile card action row to wrap on mobile.
- Standardized admin form fields via shared `AdminFormControls` primitives.

## Validation Method

- Code-level responsive audit across admin routes/components.
- Production build validation with `npm run build`.
