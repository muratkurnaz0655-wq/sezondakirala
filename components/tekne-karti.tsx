"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import { TEKNE_OZELLIKLERI, TEKNE_TIPLERI } from "@/lib/villa-sabitleri";

type Tekne = {
  id: string;
  slug?: string | null;
  baslik: string;
  konum: string;
  gunluk_fiyat: number;
  kapasite?: number | null;
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

const labelMap = new Map<string, string>([
  ...TEKNE_OZELLIKLERI.map((item) => [item.value, item.label]),
  ...TEKNE_TIPLERI.map((item) => [item.value, item.label]),
]);

export function TekneKarti({ tekne }: { tekne: Tekne }) {
  const medya = tekne.ilan_medyalari ?? [];
  const kapak = [...medya].sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0))[0]?.url ?? null;
  const etiketler = parseOzellikler(tekne.ozellikler);
  const href = `/tekneler/${tekne.slug ?? tekne.id}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-56 w-full md:h-auto md:w-72 md:flex-shrink-0">
          {kapak ? (
            <Image src={kapak} alt={tekne.baslik} fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-5xl">⚓</div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {fixTurkishDisplay(tekne.konum)}
            </p>
            <h3 className="mb-3 text-lg font-bold text-slate-800">{fixTurkishDisplay(tekne.baslik)}</h3>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#0e9aa7]/20 bg-[#f0fdfd] px-3 py-1 text-xs font-medium text-[#0e9aa7]">
              <Users className="h-3.5 w-3.5" />
              {tekne.kapasite ?? 0} kişi kapasite
            </div>
            <div className="flex flex-wrap gap-1.5">
              {etiketler.slice(0, 6).map((oz) => (
                <span key={oz} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  {labelMap.get(oz) ?? fixTurkishDisplay(oz)}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xl font-bold text-[#0e9aa7]">{formatCurrency(tekne.gunluk_fiyat)}</p>
              <p className="text-xs text-slate-500">/ günlük</p>
            </div>
            <Link href={href} className="rounded-xl bg-[#0e9aa7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b7f89]">
              İncele
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
