"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FAVORITES_CHANGED_EVENT,
  readFavorites,
  type FavoriteItem,
  writeFavorites,
} from "@/lib/favorites";

export function FavoritesPanel() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(readFavorites);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync as EventListener);
    };
  }, []);

  function removeFavorite(id: string) {
    const next = favorites.filter((item) => item.id !== id);
    setFavorites(next);
    writeFavorites(next);
  }

  const hasData = useMemo(() => favorites.length > 0, [favorites.length]);

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Henuz favori ilaniniz bulunmuyor.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {favorites.map((favorite) => {
        const href =
          favorite.tip === "tekne"
            ? `/tekneler/${favorite.slug || favorite.id}`
            : `/konaklama/${favorite.slug || favorite.id}`;

        return (
          <article
            key={favorite.id}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <h2 className="font-semibold text-slate-900">{favorite.baslik}</h2>
            <p className="text-sm text-slate-600">{favorite.konum}</p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={href}
                className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-medium text-white"
              >
                Ilana Git
              </Link>
              <button
                type="button"
                onClick={() => removeFavorite(favorite.id)}
                className="rounded-lg border border-red-300 px-3 py-2 text-xs text-red-600"
              >
                Kaldir
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
