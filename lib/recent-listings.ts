export const RECENT_LISTINGS_STORAGE_KEY = "sdk_recent_listings_v1";
export const RECENT_MAX = 8;

export type RecentListingEntry = {
  id: string;
  slug: string;
  tip: "villa" | "tekne";
  baslik: string;
  konum: string;
  gunluk_fiyat: number;
  image: string;
};

function safeParse(raw: string | null): RecentListingEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (row): row is RecentListingEntry =>
        row &&
        typeof row === "object" &&
        typeof (row as RecentListingEntry).id === "string" &&
        typeof (row as RecentListingEntry).slug === "string" &&
        ((row as RecentListingEntry).tip === "villa" || (row as RecentListingEntry).tip === "tekne"),
    );
  } catch {
    return [];
  }
}

export function readRecentListings(): RecentListingEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(RECENT_LISTINGS_STORAGE_KEY));
}

export function writeRecentListings(entries: RecentListingEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_LISTINGS_STORAGE_KEY, JSON.stringify(entries.slice(0, RECENT_MAX)));
}

export function pushRecentListing(entry: RecentListingEntry) {
  if (typeof window === "undefined") return;
  const prev = readRecentListings().filter((item) => item.id !== entry.id);
  writeRecentListings([entry, ...prev]);
}

/** Tarayıcıda kayıtlı son bakılanlar içinden yalnızca `existingIds` içinde olanları bırakır; localStorage'ı günceller. */
export function pruneRecentListingsToExistingIds(existingIds: Set<string>): RecentListingEntry[] {
  if (typeof window === "undefined") return [];
  const entries = readRecentListings();
  const next = entries.filter((e) => existingIds.has(e.id));
  if (next.length !== entries.length) {
    writeRecentListings(next);
  }
  return next;
}
