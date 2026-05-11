"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import { TEKNE_OZELLIKLERI, TEKNE_TIPLERI } from "@/lib/villa-sabitleri";
import { FAVORITES_CHANGED_EVENT, isFavorite, toggleFavorite } from "@/lib/favorites";

const ACCENT = "#1D9E75";

type Tekne = {
  id: string;
  slug?: string | null;
  baslik: string;
  konum: string;
  gunluk_fiyat: number;
  kapasite?: number | null;
  yatak_odasi?: number | null;
  sponsorlu?: boolean;
  ozellikler?: unknown;
  ilan_medyalari?: Array<{ url: string; sira?: number; tip?: string }> | null;
};

function parseOzellikler(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (!value || typeof value !== "object") return [];
  const row = value as Record<string, unknown>;
  const etiketler = row.etiketler;
  if (Array.isArray(etiketler)) return etiketler.filter((item): item is string => typeof item === "string");
  return Object.keys(row).filter((key) => row[key] === true);
}

const labelMapEntries: Array<[string, string]> = [...TEKNE_OZELLIKLERI.map((item): [string, string] => [item.value, item.label])];
const labelMap = new Map<string, string>(labelMapEntries);

function tekneTipEtiketi(etiketler: string[]): string | null {
  for (const t of TEKNE_TIPLERI) {
    if (etiketler.includes(t.value)) {
      const parts = t.label.trim().split(/\s+/);
      return parts.length > 1 ? parts.slice(1).join(" ") : t.label;
    }
  }
  return null;
}

export function TekneKarti({ tekne }: { tekne: Tekne }) {
  const medya = tekne.ilan_medyalari ?? [];
  const kapak = [...medya].sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0))[0]?.url ?? null;
  const etiketler = parseOzellikler(tekne.ozellikler);
  const href = `/tekneler/${tekne.slug ?? tekne.id}`;
  const tipBadge = tekneTipEtiketi(etiketler) ?? "Tekne";
  const baslikGosterim = fixTurkishDisplay(tekne.baslik);
  const konumGosterim = fixTurkishDisplay(tekne.konum);
  const [favori, setFavori] = useState(false);

  useEffect(() => {
    setFavori(isFavorite(tekne.id));
    const sync = () => setFavori(isFavorite(tekne.id));
    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync as EventListener);
    };
  }, [tekne.id]);

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 motion-safe:hover:translate-y-[-4px] motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/10">
      <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-t-xl">
        <Link href={href} className="relative block h-full w-full" aria-label={`${baslikGosterim} görseli`}>
          {kapak ? (
            <Image
              src={kapak}
              alt={tekne.baslik}
              fill
              className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-5xl">⚓</div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-[1] flex flex-wrap gap-2">
          <span className="rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-800 shadow-sm backdrop-blur-sm">
            {tipBadge}
          </span>
          {tekne.sponsorlu ? (
            <span className="rounded-full border border-amber-200/80 bg-amber-100/95 px-2.5 py-1 text-[11px] font-semibold text-amber-900 shadow-sm backdrop-blur-sm">
              Öne çıkan
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() =>
            setFavori(
              toggleFavorite({
                id: tekne.id,
                baslik: baslikGosterim,
                konum: konumGosterim,
                tip: "tekne",
                slug: tekne.slug ?? tekne.id,
              }),
            )
          }
          className="absolute right-3 top-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 shadow-md transition-all duration-200 hover:scale-105 hover:border-red-200 active:scale-[0.98]"
          aria-label="Favorilere ekle"
        >
          <Heart
            className={`h-4 w-4 transition-colors duration-200 ${
              favori ? "fill-[#1D9E75] text-[#1D9E75]" : "text-slate-500 group-hover:text-red-500"
            }`}
          />
        </button>

        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-slate-900/0 opacity-0 transition-all duration-300 motion-safe:group-hover:bg-slate-900/35 motion-safe:group-hover:opacity-100">
          <span className="translate-y-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold shadow-lg transition-transform duration-300 motion-safe:group-hover:translate-y-0" style={{ color: ACCENT }}>
            İncele
          </span>
        </div>
      </div>

      <Link href={href} className="flex min-h-0 flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-[#185FA5]">
          {baslikGosterim}
        </h3>
        <p className="mt-1 line-clamp-1 text-[13px] text-slate-500">{konumGosterim}</p>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[13px] font-medium text-slate-700 ring-1 ring-slate-100">
          <Users className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          {tekne.kapasite ?? 0} kişi
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {etiketler.slice(0, 4).map((oz) => {
            const label = labelMap.get(oz);
            return label ? (
              <span
                key={oz}
                className="rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-800"
              >
                {label}
              </span>
            ) : null;
          })}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-3">
          <p className="text-xl font-bold leading-tight" style={{ color: ACCENT }}>
            {formatCurrency(tekne.gunluk_fiyat)}
            <span className="ml-1 text-[13px] font-normal text-slate-400">/ günlük</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
