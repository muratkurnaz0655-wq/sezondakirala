"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Clock, Package, Users } from "lucide-react";
import type { Paket } from "@/types/supabase";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";

type PackageCardProps = {
  paket: Paket;
  /** Ana sayfa öne çıkan grid — sabit görsel yüksekliği ve kart token'ları */
  variant?: "default" | "home";
};

const KATEGORI_ETIKET: Record<string, string> = {
  tumu: "Tümü",
  macera: "Macera",
  luks: "Lüks",
  romantik: "Romantik",
  aile: "Aile",
};

const KATEGORI_RENK: Record<string, string> = {
  macera: "border-orange-200/90 bg-orange-50 text-orange-900",
  luks: "border-amber-200/90 bg-amber-100 text-amber-950",
  romantik: "border-pink-200/90 bg-pink-50 text-pink-900",
  aile: "border-sky-200/90 bg-sky-50 text-sky-900",
};

/** Ana sayfa — spesifikasyon renkleri */
const KATEGORI_RENK_HOME: Record<string, string> = {
  luks: "bg-[#FEF3C7] text-[#92400E]",
  romantik: "bg-[#FCE7F3] text-[#9D174D]",
  macera: "bg-[#FED7AA] text-[#92400E]",
  aile: "bg-[#DBEAFE] text-[#1E40AF]",
};

const PAKET_GORSEL =
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80";

function kategoriLabel(raw: string | null | undefined) {
  if (!raw) return "Paket";
  const key = raw.toLowerCase().trim();
  return KATEGORI_ETIKET[key] ?? fixTurkishDisplay(raw);
}

export function PackageCard({ paket, variant = "default" }: PackageCardProps) {
  const [kapakYuklendi, setKapakYuklendi] = useState(false);
  const isHome = variant === "home";
  const baslik = fixTurkishDisplay(paket.baslik);
  const aciklama = fixTurkishDisplay(paket.aciklama ?? "").trim();
  const kat = (paket.kategori ?? "macera").toLowerCase().trim();
  const hasCustomImage = Boolean(paket.gorsel_url?.trim());
  const kapak = hasCustomImage ? (paket.gorsel_url as string) : PAKET_GORSEL;
  const badgeClassDefault = KATEGORI_RENK[kat] ?? "border-slate-200/90 bg-slate-100 text-slate-800";
  const badgeClassHome = KATEGORI_RENK_HOME[kat] ?? "bg-slate-100 text-slate-700";

  if (isHome) {
    return (
      <article className="flex h-full w-full max-w-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
        <div className="relative h-[200px] w-full shrink-0 overflow-hidden bg-[#F1F5F9]">
          {hasCustomImage ? (
            <>
              {!kapakYuklendi ? (
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                  aria-hidden
                />
              ) : null}
              <Image
                src={kapak}
                alt={baslik}
                fill
                loading="lazy"
                className={`object-cover transition-opacity duration-500 ${kapakYuklendi ? "opacity-100" : "opacity-0"}`}
                sizes="(max-width: 768px) 100vw, 360px"
                onLoadingComplete={() => setKapakYuklendi(true)}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center" aria-hidden>
              <Package className="h-14 w-14 text-slate-300" strokeWidth={1.25} />
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[12px] font-medium shadow-sm ${badgeClassHome}`}
          >
            {kategoriLabel(paket.kategori)}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-5">
          <h3 className="mb-2 break-words text-[17px] font-semibold leading-snug text-[#1E293B]">{baslik}</h3>
          <p className="line-clamp-2 text-[14px] leading-[1.6] text-[#64748B]">
            {aciklama || "Paket detayları için inceleyin."}
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-[#64748B]">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="shrink-0 text-[#64748B]" aria-hidden />
              {paket.sure_gun} gün
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="shrink-0 text-[#64748B]" aria-hidden />
              Max {paket.kapasite} kişi
            </span>
          </div>

          <p className="mt-auto pt-3 text-[20px] font-bold leading-tight text-[#1D9E75]">{formatCurrency(paket.fiyat)}</p>

          <Link
            href={`/paketler/${paket.slug}`}
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#1D9E75] py-3 text-[15px] font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#0F6E56]"
          >
            İncele
          </Link>
        </div>
      </article>
    );
  }

  return (
    <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/10">
      <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-t-xl bg-slate-200">
        {!kapakYuklendi ? (
          <div
            className="absolute inset-0 z-[1] animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            aria-hidden
          />
        ) : null}
        <Image
          src={kapak}
          alt={baslik}
          fill
          loading="lazy"
          className={`object-cover transition-[opacity,transform] duration-500 motion-safe:group-hover:scale-105 ${
            kapakYuklendi ? "opacity-100" : "opacity-0"
          }`}
          sizes="(max-width: 768px) 100vw, 33vw"
          onLoadingComplete={() => setKapakYuklendi(true)}
        />
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-[2px] ${badgeClassDefault}`}
        >
          {kategoriLabel(paket.kategori)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-medium leading-snug text-slate-900">{baslik}</h3>
        <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-slate-500">
          {aciklama || "Paket detayları için inceleyin."}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" aria-hidden />
            {paket.sure_gun} gün
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" aria-hidden />
            Max {paket.kapasite} kişi
          </span>
        </div>

        <p className="mt-4 text-2xl font-bold text-[#1D9E75]">{formatCurrency(paket.fiyat)}</p>

        <div className="mt-auto pt-4">
          <Link
            href={`/paketler/${paket.slug}`}
            className="flex w-full items-center justify-center rounded-xl bg-[#1D9E75] py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0F6E56]"
          >
            İncele
          </Link>
        </div>
      </div>
    </div>
  );
}
