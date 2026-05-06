"use client";

import { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import {
  FAVORITES_CHANGED_EVENT,
  type FavoriteItem,
  isFavorite,
  toggleFavorite,
} from "@/lib/favorites";

type HomeFavoriButonProps = {
  className?: string;
  "aria-label"?: string;
  item: FavoriteItem;
};

export function HomeFavoriButon({
  className = "absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110",
  "aria-label": ariaLabel = "Favorilere ekle",
  item,
}: HomeFavoriButonProps) {
  const active = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(FAVORITES_CHANGED_EVENT, onStoreChange as EventListener);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(FAVORITES_CHANGED_EVENT, onStoreChange as EventListener);
      };
    },
    () => isFavorite(item.id),
    () => false,
  );

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = toggleFavorite(item);
        toast.success(next ? "Favorilere eklendi ❤️" : "Favorilerden çıkarıldı");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          const next = toggleFavorite(item);
          toast.success(next ? "Favorilere eklendi ❤️" : "Favorilerden çıkarıldı");
        }
      }}
    >
      <Heart
        size={16}
        className={`transition-colors ${active ? "fill-red-500 text-red-500" : "text-slate-400 group-hover:text-red-500"}`}
      />
    </span>
  );
}
