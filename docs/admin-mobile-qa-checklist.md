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

## Device Test Matrix

- iPhone SE (375x667): topbar single-line title, sidebar open/close, list card actions wrap.
- iPhone 14 Pro Max (430x932): filter form spacing, segmented tabs horizontal scroll, modal close button reachability.
- Galaxy S22 (360x780): reservation card buttons do not overflow, support modal textarea and action buttons remain visible.
- iPad Mini (768x1024): transition boundary between mobile cards and desktop-like spacing feels stable.
- 1366x768 laptop: desktop tables visible, no clipped columns, sticky topbar and sidebar alignment preserved.

## Quick Manual Pass (Per Route)

- `/yonetim`: stats cards wrap cleanly, quick links remain tappable.
- `/yonetim/ilanlar`: both segmented tab groups scroll on narrow width, listing actions wrap in mobile cards.
- `/yonetim/paketler`: package mobile cards render edit flow and keep modal usable on small viewport.
- `/yonetim/kullanicilar`: search + sort controls stack without overlap, role select/save stays tappable.
- `/yonetim/rezervasyonlar`: dense filter form remains usable, detail button and status control share row safely.
- `/yonetim/ayarlar`: settings form fields remain single-column and readable on small devices.
