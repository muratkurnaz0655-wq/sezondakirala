"use client";

import Image from "next/image";
import Link from "next/link";
import { Bed, Heart, MapPin, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import { TEKNE_OZELLIKLERI } from "@/lib/villa-sabitleri";

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

const labelMapEntries: Array<[string, string]> = [
  ...TEKNE_OZELLIKLERI.map((item): [string, string] => [item.value, item.label]),
];
const labelMap = new Map<string, string>(labelMapEntries);

export function TekneKarti({ tekne }: { tekne: Tekne }) {
  const medya = tekne.ilan_medyalari ?? [];
  const kapak = [...medya].sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0))[0]?.url ?? null;
  const etiketler = parseOzellikler(tekne.ozellikler);
  const href = `/tekneler/${tekne.slug ?? tekne.id}`;

  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#0e9aa7]/30 hover:shadow-xl hover:shadow-[#0e9aa7]/10 sm:flex-row">
      <div className="relative h-52 w-full flex-shrink-0 sm:h-auto sm:w-52 lg:w-60">
        <Link href={href} className="block h-full w-full">
          {kapak ? (
            <Image src={kapak} alt={tekne.baslik} fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-5xl">⚓</div>
          )}
        </Link>
        {tekne.sponsorlu ? (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-xs font-bold text-white shadow-sm">
            Öne Çıkan
          </span>
        ) : null}
        <button
          type="button"
          aria-label="Favori"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:bg-white"
        >
          <Heart className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="mb-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#0e9aa7]" />
            <span className="text-xs font-medium text-[#0e9aa7]">{fixTurkishDisplay(tekne.konum)}</span>
          </div>
          <h3 className="mb-2 line-clamp-2 text-base font-bold text-slate-800 sm:text-lg">{fixTurkishDisplay(tekne.baslik)}</h3>
          <div className="mb-3 flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {tekne.kapasite ?? 0} kişi
            </span>
            {(tekne.yatak_odasi ?? 0) > 0 ? (
              <span className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                {tekne.yatak_odasi} kabin
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {etiketler.slice(0, 4).map((oz) => {
              const label = labelMap.get(oz);
              return label ? (
                <span
                  key={oz}
                  className="rounded-full border border-[#0e9aa7]/20 bg-[#f0fdfd] px-2.5 py-0.5 text-xs text-[#0e9aa7]"
                >
                  {label}
                </span>
              ) : null;
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="text-xl font-bold text-[#0e9aa7]">{formatCurrency(tekne.gunluk_fiyat)}</span>
            <span className="ml-1 text-xs text-slate-400">/ günlük</span>
          </div>
          <Link
            href={href}
            className="rounded-xl bg-[#0e9aa7] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#0e9aa7]/20 transition-all hover:bg-[#0f4c5c] active:scale-95"
          >
            İncele
          </Link>
        </div>
      </div>
    </article>
  );
}
