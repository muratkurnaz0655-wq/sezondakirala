"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

type MediaRow = { id: string; url: string };

type ListingGalleryProps = {
  media: MediaRow[];
};

export function ListingGallery({ media }: ListingGalleryProps) {
  const items = useMemo(
    () => (media.length ? media : [{ id: "placeholder", url: "/images/villa-placeholder.svg" }]),
    [media],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slides = useMemo(
    () =>
      items.map((item) => ({
        src: item.url,
      })),
    [items],
  );

  const last = items.length - 1;

  return (
    <div className="space-y-3 overflow-x-hidden">
      <div className="hidden md:block">
        <div className="relative h-[min(70vh,520px)] overflow-hidden rounded-2xl bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={items[activeIndex]?.url}
            alt={`Galeri ${activeIndex + 1}`}
            className="h-full w-full cursor-pointer object-cover transition-opacity duration-200"
            onClick={() => setIsOpen(true)}
          />
          {items.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => Math.max(0, i - 1));
                }}
                disabled={activeIndex === 0}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-lg transition hover:bg-white disabled:pointer-events-none disabled:opacity-35"
                aria-label="Önceki fotoğraf"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => Math.min(last, i + 1));
                }}
                disabled={activeIndex === last}
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-lg transition hover:bg-white disabled:pointer-events-none disabled:opacity-35"
                aria-label="Sonraki fotoğraf"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
            {activeIndex + 1} / {items.length}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIndex ? "border-sky-500 ring-2 ring-sky-200" : "border-transparent opacity-80 hover:opacity-100"
              }`}
              aria-label={`Fotoğraf ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        <button
          type="button"
          className="relative mb-6 block h-64 w-full touch-pan-y overflow-hidden rounded-2xl bg-slate-100 sm:h-80"
          onClick={() => setIsOpen(true)}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              const end = e.changedTouches[0]?.clientX;
              if (start == null || end == null || items.length < 2) return;
              const dx = end - start;
              if (dx > 48) setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
              else if (dx < -48) setActiveIndex((prev) => (prev + 1) % items.length);
            }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={items[activeIndex]?.url}
            alt="Mobil galeri fotoğrafı"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            {activeIndex + 1} / {items.length}
          </div>
        </button>
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 scrollbar-none">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-20 flex-shrink-0 snap-start overflow-hidden rounded-xl border ${index === activeIndex ? "border-sky-500" : "border-transparent opacity-80"}`}
              aria-label={`Fotoğraf ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
      >
        Tüm fotoğrafları gör
      </button>

      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        index={activeIndex}
        slides={slides}
        plugins={[Thumbnails]}
        carousel={{ finite: false }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        on={{ view: ({ index }) => setActiveIndex(index) }}
        render={{
          buttonPrev: items.length > 1 ? undefined : () => null,
          buttonNext: items.length > 1 ? undefined : () => null,
        }}
      />
    </div>
  );
}
