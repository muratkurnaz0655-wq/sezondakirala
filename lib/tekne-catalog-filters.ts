import { defaultTekneFiltre, TEKNE_PRICE_FILTER_DEFAULT_MAX, type TekneFiltre } from "@/lib/villa-sabitleri";

export function listingTeknePrice(listing: { gunluk_fiyat?: number | null }): number {
  const v = listing.gunluk_fiyat;
  if (v == null || Number.isNaN(Number(v))) return 0;
  return Number(v);
}

export function isDefaultTeknePriceFilter(filtre: Pick<TekneFiltre, "minFiyat" | "maxFiyat">) {
  return (
    (filtre.minFiyat ?? 0) <= defaultTekneFiltre.minFiyat &&
    (filtre.maxFiyat ?? 0) >= TEKNE_PRICE_FILTER_DEFAULT_MAX
  );
}

export function matchesTeknePriceFilter(
  listing: { gunluk_fiyat?: number | null },
  filtre: Pick<TekneFiltre, "minFiyat" | "maxFiyat">,
) {
  const nightly = listingTeknePrice(listing);
  const minFiyat = Number(filtre.minFiyat) || 0;
  const maxFiyat = Number(filtre.maxFiyat) || TEKNE_PRICE_FILTER_DEFAULT_MAX;
  return nightly >= minFiyat && nightly <= maxFiyat;
}

function parseEtiketler(ozellikler: unknown): string[] {
  if (Array.isArray(ozellikler)) return ozellikler.filter((item): item is string => typeof item === "string");
  if (!ozellikler || typeof ozellikler !== "object") return [];
  const row = ozellikler as Record<string, unknown>;
  const etiketler = row.etiketler;
  if (Array.isArray(etiketler)) return etiketler.filter((item): item is string => typeof item === "string");
  return Object.keys(row).filter((key) => row[key] === true);
}

export function applyTekneCatalogFilters<T extends { ozellikler?: unknown; konum?: string | null; kapasite?: number | null; gunluk_fiyat?: number | null }>(
  rows: T[],
  filtre: TekneFiltre,
): T[] {
  return rows.filter((row) => {
    if (filtre.liman.length > 0) {
      const konum = (row.konum ?? "").toLowerCase();
      if (!filtre.liman.some((l) => konum.includes(l.split(",")[0].trim().toLowerCase()))) return false;
    }

    if (!isDefaultTeknePriceFilter(filtre) && !matchesTeknePriceFilter(row, filtre)) return false;

    if (filtre.minKapasite > 1 && (row.kapasite ?? 0) < filtre.minKapasite) return false;

    const etiketler = parseEtiketler(row.ozellikler);
    if (filtre.sure.length > 0 && etiketler.length > 0 && !filtre.sure.some((sure) => etiketler.includes(sure))) {
      return false;
    }
    if (filtre.ozellikler.length > 0 && !filtre.ozellikler.every((oz) => etiketler.includes(oz))) return false;
    if (filtre.tekne_tipi.length > 0 && !filtre.tekne_tipi.some((tip) => etiketler.includes(tip))) return false;

    return true;
  });
}

export function sortTekneCatalogListings<
  T extends { sponsorlu?: boolean | null; olusturulma_tarihi?: string | null; gunluk_fiyat?: number | null; kapasite?: number | null },
>(rows: T[], siralama: TekneFiltre["siralama"]): T[] {
  const sorted = [...rows];
  switch (siralama) {
    case "fiyat_artan":
      sorted.sort((a, b) => listingTeknePrice(a) - listingTeknePrice(b));
      break;
    case "fiyat_azalan":
      sorted.sort((a, b) => listingTeknePrice(b) - listingTeknePrice(a));
      break;
    case "kapasite_buyuk":
      sorted.sort((a, b) => (b.kapasite ?? 0) - (a.kapasite ?? 0));
      break;
    default:
      sorted.sort((a, b) => {
        const s = Number(b.sponsorlu) - Number(a.sponsorlu);
        if (s !== 0) return s;
        return (
          new Date(b.olusturulma_tarihi ?? 0).getTime() - new Date(a.olusturulma_tarihi ?? 0).getTime()
        );
      });
  }
  return sorted;
}
