export type FavoriteItem = {
  id: string;
  baslik: string;
  konum: string;
  tip: "villa" | "tekne";
  slug: string;
};

const FAVORITES_KEY = "favoriler";
export const FAVORITES_CHANGED_EVENT = "favorites:changed";

export function readFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

export function writeFavorites(next: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

export function isFavorite(id: string) {
  return readFavorites().some((item) => item.id === id);
}

export function toggleFavorite(item: FavoriteItem) {
  const favorites = readFavorites();
  const exists = favorites.some((fav) => fav.id === item.id);
  const next = exists ? favorites.filter((fav) => fav.id !== item.id) : [...favorites, item];
  writeFavorites(next);
  return !exists;
}
