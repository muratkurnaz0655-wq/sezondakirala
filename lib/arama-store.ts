"use client";

export interface AramaState {
  giris: string | null;
  cikis: string | null;
  gun?: number | null;
  yetiskin: number;
  cocuk: number;
  bebek: number;
  tip: "villa" | "tekne" | null;
}

export interface RezervasyonState {
  slug: string;
  ilanTip: "villa" | "tekne";
  giris: string | null;
  cikis: string | null;
  gun: number | null;
  yetiskin: number;
  cocuk: number;
  bebek: number;
  adim: number;
}

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, JSON.stringify(data));
}

function safeClear(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

function clearAramaCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "arama=; path=/; max-age=0; samesite=lax";
}

const ARAMA_STORE_CHANGED_EVENT = "arama-store:changed";
let cachedAramaState: AramaState | null | undefined;

function getAramaSnapshot(): AramaState | null {
  if (cachedAramaState !== undefined) return cachedAramaState;
  cachedAramaState = safeGet<AramaState>("arama");
  return cachedAramaState;
}

export const aramaStore = {
  save: (data: AramaState) => {
    cachedAramaState = data;
    safeSet("arama", data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(ARAMA_STORE_CHANGED_EVENT));
    }
  },
  get: (): AramaState | null => getAramaSnapshot(),
  clear: () => {
    cachedAramaState = null;
    safeClear("arama");
    clearAramaCookie();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(ARAMA_STORE_CHANGED_EVENT));
    }
  },
  /** Misafir / tip korunur; yalnızca tarih aralığı kaldırılır (liste sayfası filtresi). */
  clearDates: () => {
    const current = getAramaSnapshot();
    if (!current) {
      clearAramaCookie();
    } else {
      const next: AramaState = {
        ...current,
        giris: null,
        cikis: null,
        gun: null,
      };
      cachedAramaState = next;
      safeSet("arama", next);
      if (typeof document !== "undefined") {
        document.cookie = `arama=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=86400; samesite=lax`;
      }
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(ARAMA_STORE_CHANGED_EVENT));
    }
  },
  subscribe: (listener: () => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }
    const handler = () => listener();
    window.addEventListener(ARAMA_STORE_CHANGED_EVENT, handler);
    return () => window.removeEventListener(ARAMA_STORE_CHANGED_EVENT, handler);
  },
};

export const rezervasyonStore = {
  save: (data: RezervasyonState) => safeSet("rezervasyon", data),
  get: (): RezervasyonState | null => safeGet<RezervasyonState>("rezervasyon"),
  update: (partial: Partial<RezervasyonState>) => {
    const current = rezervasyonStore.get();
    if (!current) return;
    rezervasyonStore.save({ ...current, ...partial });
  },
  clear: () => safeClear("rezervasyon"),
};
