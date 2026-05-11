"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, MapPin, Star, Waves } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import {
  FAVORITES_CHANGED_EVENT,
  isFavorite,
  toggleFavorite,
} from "@/lib/favorites";

const ACCENT = "#1D9E75";

const tagRenkleri: Record<string, string> = {
  wifi: "border-emerald-200/80 bg-emerald-50 text-emerald-900",
  havuz: "border-sky-200/80 bg-sky-50 text-sky-900",
  klima: "border-amber-200/80 bg-amber-50 text-amber-900",
  jakuzi: "border-violet-200/80 bg-violet-50 text-violet-900",
  tv: "border-slate-200/80 bg-slate-100 text-slate-800",
  default: "border-slate-200/80 bg-slate-100 text-slate-800",
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
}: IlanListeKartiProps) {
  const [favori, setFavori] = useState(false);
  const foto = fotograflar[0] ?? null;
  const baslikGosterim = fixTurkishDisplay(baslik);
  const konumGosterim = [konum, ilce].filter(Boolean).map((item) => fixTurkishDisplay(item)).join(", ");
  const safeSlug = slug || id;
  const detailPath = `/${tip === "tekne" ? "tekneler" : "konaklama"}/${safeSlug}`;
  const href = detailPath;
  const tipEtiket = tip === "tekne" ? "Tekne" : "Villa";

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

  const toplamFiyat = geceSayisi > 1 ? fiyat * geceSayisi : fiyat;
  const puanGoster = puan > 0;
  const odaBanyoKisiParcalari: string[] = [];
  if (oda_sayisi != null && oda_sayisi > 0) {
    odaBanyoKisiParcalari.push(`${oda_sayisi} ${tip === "tekne" ? "kabin" : "oda"}`);
  }
  if (banyo_sayisi != null && banyo_sayisi > 0) {
    odaBanyoKisiParcalari.push(`${banyo_sayisi} banyo`);
  }
  if (kapasite != null && kapasite > 0) {
    odaBanyoKisiParcalari.push(`${kapasite} kişi`);
  }
  const odaBanyoKisiMetin = odaBanyoKisiParcalari.join(" · ");

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 motion-safe:hover:translate-y-[-4px] motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/10">
      <div className="relative h-[240px] w-full shrink-0 overflow-hidden rounded-t-xl">
        <Link href={href} className="relative block h-full w-full" aria-label={`${baslikGosterim} görseli`}>
          {foto ? (
            <Image
              src={foto}
              alt={baslik}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={false}
              loading="lazy"
              className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 text-slate-500">
              <Waves className="h-12 w-12" />
              <span className="mt-2 text-xs">Fotoğraf yakında</span>
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-[1] flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-800 shadow-sm backdrop-blur-sm">
            {tipEtiket}
          </span>
          {one_cikan ? (
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
                id,
                baslik: baslikGosterim,
                konum: konumGosterim,
                tip,
                slug: safeSlug,
              }),
            )
          }
          className="absolute right-3 top-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 shadow-md transition-all duration-200 hover:scale-105 hover:border-red-200 hover:shadow-lg active:scale-[0.98]"
          aria-label="Favorilere ekle"
        >
          <Heart
            className={`h-4 w-4 transition-colors duration-200 ${
              favori ? "fill-[#1D9E75] text-[#1D9E75]" : "text-slate-500 group-hover:text-red-500"
            }`}
          />
        </button>
      </div>

      <Link href={href} className="flex min-h-0 flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-[#185FA5]">
            {baslikGosterim}
          </h3>
          <div className="mt-1.5 flex items-start gap-1 text-[13px] text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="line-clamp-1">{konumGosterim}</span>
          </div>

          {odaBanyoKisiMetin ? (
            <p className="mt-3 text-[13px] font-medium leading-snug text-slate-600">{odaBanyoKisiMetin}</p>
          ) : null}

          {ozellikler.slice(0, 3).length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ozellikler.slice(0, 3).map((oz) => (
                <span
                  key={oz}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    tagRenkleri[oz.toLowerCase()] ?? tagRenkleri.default
                  }`}
                >
                  {fixTurkishDisplay(oz)}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="min-w-0">
              {puanGoster ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i <= Math.round(puan) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                        aria-hidden
                      />
                    ))}
                  </div>
                  <span className="text-[13px] font-medium text-slate-600">
                    {puan.toFixed(1)}
                    {yorum_sayisi > 0 ? ` (${yorum_sayisi})` : ""}
                  </span>
                </div>
              ) : (
                <span className="text-[12px] text-slate-400">Yeni ilan</span>
              )}
            </div>

            <div className="shrink-0 text-right">
              {geceSayisi > 1 ? (
                <>
                  <p className="text-lg font-bold leading-tight" style={{ color: ACCENT }}>
                    {formatCurrency(toplamFiyat)}
                  </p>
                  <p className="text-[11px] text-slate-400">{geceSayisi} gece toplam</p>
                  <p className="text-[11px] text-slate-400">{formatCurrency(fiyat)} / gece</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold leading-tight" style={{ color: ACCENT }}>
                    {formatCurrency(fiyat)}
                  </p>
                  <p className="text-[13px] text-slate-400">/ gece</p>
                </>
              )}
            </div>
          </div>
      </Link>
    </article>
  );
}
