"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bath, BedDouble, Heart, MapPin, Star, Users, Waves, Wifi } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import {
  FAVORITES_CHANGED_EVENT,
  isFavorite,
  toggleFavorite,
} from "@/lib/favorites";

const tagRenkleri: Record<string, string> = {
  wifi: "border-[#0e9aa7]/20 bg-[#f0fdfd] text-[#0e9aa7]",
  havuz: "border-[#0e9aa7]/20 bg-[#f0fdfd] text-[#0e9aa7]",
  klima: "border-[#0e9aa7]/20 bg-[#f0fdfd] text-[#0e9aa7]",
  jakuzi: "border-[#0e9aa7]/20 bg-[#f0fdfd] text-[#0e9aa7]",
  tv: "border-[#0e9aa7]/20 bg-[#f0fdfd] text-[#0e9aa7]",
  default: "border-[#0e9aa7]/20 bg-[#f0fdfd] text-[#0e9aa7]",
};

interface IlanListeKartiProps {
  id: string;
  slug: string;
  baslik: string;
  konum: string;
  ilce?: string;
  fiyat: number;
  tip: "villa" | "tekne";
  oda_sayisi?: number;
  banyo_sayisi?: number;
  kapasite?: number;
  puan?: number;
  yorum_sayisi?: number;
  fotograflar?: string[];
  one_cikan?: boolean;
  ozellikler?: string[];
  geceSayisi?: number;
  giris?: string;
  cikis?: string;
  yetiskin?: string | number;
  cocuk?: string | number;
  bebek?: string | number;
}

export function IlanListeKarti({
  id,
  slug,
  baslik,
  konum,
  ilce,
  fiyat,
  tip,
  oda_sayisi,
  banyo_sayisi,
  kapasite,
  puan = 0,
  yorum_sayisi = 0,
  fotograflar = [],
  one_cikan,
  ozellikler = [],
  geceSayisi = 0,
  giris,
  cikis,
  yetiskin,
  cocuk,
  bebek,
}: IlanListeKartiProps) {
  const [favori, setFavori] = useState(false);
  const foto = fotograflar[0] ?? null;
  const baslikGosterim = fixTurkishDisplay(baslik);
  const konumGosterim = [konum, ilce].filter(Boolean).map((item) => fixTurkishDisplay(item)).join(", ");
  const safeSlug = slug || id;
  const detailPath = `/${tip === "tekne" ? "tekneler" : "konaklama"}/${safeSlug}`;
  const href = detailPath;

  useEffect(() => {
    setFavori(isFavorite(id));
    const sync = () => setFavori(isFavorite(id));
    window.addEventListener("storage", sync);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync as EventListener);
    };
  }, [id]);

  return (
    <Link href={href} className="block w-full">
      <article className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg sm:flex-row">
        <div className="relative h-52 w-full flex-shrink-0 self-stretch overflow-hidden sm:h-auto sm:w-52 lg:w-60">
          {foto ? (
            <Image
              src={foto}
              alt={baslik}
              fill
              sizes="(max-width: 768px) 100vw, 288px"
              priority={false}
              loading="lazy"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-[#ecfeff] text-slate-500">
              <Waves className="h-12 w-12" />
              <span className="mt-2 text-xs">Fotoğraf yakında</span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setFavori(
                toggleFavorite({
                  id,
                  baslik: baslikGosterim,
                  konum: konumGosterim,
                  tip,
                  slug: safeSlug,
                }),
              );
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-[0.98]"
            aria-label="Favorilere ekle"
          >
            <Heart
              className={`h-4 w-4 ${favori ? "fill-[#0e9aa7] text-[#0e9aa7]" : "text-slate-500"}`}
            />
          </button>

          {one_cikan ? <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-3 py-1 text-xs font-bold text-white shadow-sm">Öne Çıkan</div> : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-[#0e9aa7]">
              <MapPin className="h-3 w-3" />
              <span>{konumGosterim}</span>
            </div>

            <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-slate-800 transition-colors group-hover:text-[#0e9aa7] sm:text-lg">
              {baslikGosterim}
            </h3>

            <div className="mb-3 flex flex-wrap gap-1.5 text-sm text-slate-500">
              {oda_sayisi != null && oda_sayisi > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#0e9aa7]/20 bg-[#f0fdfd] px-2.5 py-0.5 text-xs text-[#0e9aa7]">
                  <BedDouble className="h-3.5 w-3.5 text-[#0e9aa7]" />
                  {oda_sayisi} {tip === "tekne" ? "kabin" : "oda"}
                </span>
              ) : null}
              {banyo_sayisi != null && banyo_sayisi > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#0e9aa7]/20 bg-[#f0fdfd] px-2.5 py-0.5 text-xs text-[#0e9aa7]">
                  <Bath className="h-3.5 w-3.5 text-[#0e9aa7]" />
                  {banyo_sayisi} banyo
                </span>
              ) : null}
              {kapasite != null && kapasite > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#0e9aa7]/20 bg-[#f0fdfd] px-2.5 py-0.5 text-xs text-[#0e9aa7]">
                  <Users className="h-3.5 w-3.5 text-[#0e9aa7]" />
                  {kapasite} kişi
                </span>
              ) : null}
            </div>

            {ozellikler.slice(0, 3).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {ozellikler.slice(0, 3).map((oz) => (
                  <span
                    key={oz}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tagRenkleri[oz.toLowerCase()] ?? tagRenkleri.default}`}
                  >
                    {oz.toLowerCase().includes("wifi") ? <Wifi className="h-3 w-3" /> : null}
                    {fixTurkishDisplay(oz)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i <= Math.round(puan) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">
                {puan > 0 ? `${puan.toFixed(1)} (${yorum_sayisi})` : "Yeni ilan"}
              </span>
            </div>

            <div className="text-right">
              {geceSayisi > 0 ? (
                <>
                  <p className="text-xl font-bold text-[#0e9aa7]">
                    {formatCurrency(fiyat * geceSayisi)}
                  </p>
                  <p className="text-xs text-slate-500">{geceSayisi} gece toplam</p>
                  <p className="text-xs text-slate-500">{formatCurrency(fiyat)} / gece</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-[#0e9aa7]">{formatCurrency(fiyat)}</p>
                  <p className="text-xs text-slate-500">/ gece</p>
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
