import type { Ilan } from "@/types/supabase";
import { defaultFiltre, VILLA_PRICE_FILTER_DEFAULT_MAX, type VillaFiltre } from "@/types/filtre";

/** Tarih araması yokken varsayılan fiyat aralığı — üst sınır uygulanmaz. */
export function isDefaultVillaPriceFilter(
  filtre: Pick<VillaFiltre, "minFiyat" | "maxFiyat">,
  geceSayisi: number,
) {
  if (geceSayisi > 1) return false;
  return (
    (filtre.minFiyat ?? 0) <= defaultFiltre.minFiyat &&
    (filtre.maxFiyat ?? 0) >= VILLA_PRICE_FILTER_DEFAULT_MAX
  );
}

export function listingNightlyPrice(listing: { gunluk_fiyat?: number | null }): number {
  const v = listing.gunluk_fiyat;
  if (v == null || Number.isNaN(Number(v))) return 0;
  return Number(v);
}

export function matchesVillaPriceFilter(
  listing: { gunluk_fiyat?: number | null },
  filtre: Pick<VillaFiltre, "minFiyat" | "maxFiyat">,
  geceSayisi: number,
): boolean {
  const nightly = listingNightlyPrice(listing);
  const minFiyat = Number(filtre.minFiyat) || 0;
  const maxFiyat = Number(filtre.maxFiyat) || VILLA_PRICE_FILTER_DEFAULT_MAX;
  if (geceSayisi > 1) {
    const maxGecelik = Math.ceil(maxFiyat / geceSayisi);
    const minGecelik = Math.floor(minFiyat / geceSayisi);
    return nightly >= minGecelik && nightly <= maxGecelik;
  }
  return nightly >= minFiyat && nightly <= maxFiyat;
}

function extractTags(ozellikler: unknown): string[] {
  if (Array.isArray(ozellikler)) return ozellikler.filter((item): item is string => typeof item === "string");
  if (!ozellikler || typeof ozellikler !== "object") return [];
  const row = ozellikler as Record<string, unknown>;
  const etiketler = row.etiketler;
  if (Array.isArray(etiketler)) return etiketler.filter((item): item is string => typeof item === "string");
  const kategori = row.kategori;
  if (typeof kategori === "string" && kategori) return [kategori];
  return Object.keys(row).filter((key) => row[key] === true);
}

export function applyVillaCatalogFilters<T extends Ilan>(
  rows: T[],
  filtre: VillaFiltre,
  geceSayisi: number,
): T[] {
  return rows.filter((row) => {
    if (filtre.bolge.length > 0) {
      const konum = (row.konum ?? "").toLowerCase();
      const bolgeMatch = filtre.bolge.some((b) => konum.includes(b.split(",")[0].trim().toLowerCase()));
      if (!bolgeMatch) return false;
    }

    if (!isDefaultVillaPriceFilter(filtre, geceSayisi) && !matchesVillaPriceFilter(row, filtre, geceSayisi)) {
      return false;
    }

    if (filtre.minKisi > 1 && (row.kapasite ?? 0) < filtre.minKisi) return false;
    if (filtre.minYatakOdasi > 1 && (row.yatak_odasi ?? 0) < filtre.minYatakOdasi) return false;
    if (filtre.minBanyo > 1 && (row.banyo ?? 0) < filtre.minBanyo) return false;

    const tags = extractTags(row.ozellikler);
    if (filtre.kategori.length > 0 && !filtre.kategori.some((kat) => tags.includes(kat))) return false;
    if (filtre.ozellikler.length > 0 && !filtre.ozellikler.every((oz) => tags.includes(oz))) return false;

    return true;
  });
}

export function sortVillaCatalogListings<T extends Ilan & { sponsorlu?: boolean | null }>(
  rows: T[],
  siralama: VillaFiltre["siralama"],
): T[] {
  const sorted = [...rows];
  switch (siralama) {
    case "fiyat_artan":
      sorted.sort((a, b) => listingNightlyPrice(a) - listingNightlyPrice(b));
      break;
    case "fiyat_azalan":
      sorted.sort((a, b) => listingNightlyPrice(b) - listingNightlyPrice(a));
      break;
    case "yeni_eklenen":
      sorted.sort(
        (a, b) =>
          new Date(b.olusturulma_tarihi ?? 0).getTime() - new Date(a.olusturulma_tarihi ?? 0).getTime(),
      );
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
