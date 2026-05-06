"use client";

import { Heart, Share2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  FAVORITES_CHANGED_EVENT,
  isFavorite,
  toggleFavorite,
  type FavoriteItem,
} from "@/lib/favorites";

type ListingHeaderActionsProps = {
  item: FavoriteItem;
  title: string;
};

export function ListingHeaderActions({ item, title }: ListingHeaderActionsProps) {
  const isFav = useSyncExternalStore(
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

  const handleFavorite = () => {
    const next = toggleFavorite(item);
    toast.success(next ? "Favorilere eklendi ❤️" : "Favorilerden çıkarıldı");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      toast.success("Link kopyalandı!");
    } catch {
      toast.error("Bir hata oluştu, tekrar deneyin");
    }
  };

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={handleFavorite}
        className={`rounded-xl border p-2.5 transition-all duration-200 ${
          isFav
            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
            : "border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:text-red-400"
        }`}
        aria-label="Favori"
      >
        <Heart className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
      </button>
      <button
        type="button"
        onClick={() => void handleShare()}
        className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 transition-all duration-200 hover:border-[#0e9aa7]/40 hover:text-[#0e9aa7]"
        aria-label="Paylaş"
      >
        <Share2 className="h-5 w-5" />
      </button>
    </div>
  );
}
