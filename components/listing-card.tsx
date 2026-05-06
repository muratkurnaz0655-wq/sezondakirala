"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Ilan } from "@/types/supabase";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { dateFromYmdLocal } from "@/lib/tr-today";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import { formatKonum } from "@/lib/format-konum";
import { HomeFavoriButon } from "@/components/HomeFavoriButon";
import { Bath, Bed, ChevronRight, Home, MapPin, MessageCircle, Star, Users } from "lucide-react";

type ListingCardProps = {
  listing: Ilan;
  /** Liste aramasından gelen tarihler (fiyat özeti + detay linkinde taşınır) */
  selectedDates?: {
    giris: string;
    cikis: string;
    yetiskin?: number;
    cocuk?: number;
  };
  /** Kart altındaki WhatsApp CTA satırını göster/gizle (vitrin alanlarında kapatılabilir). */
  showWhatsappCta?: boolean;
};

export function ListingCard({ listing, selectedDates, showWhatsappCta = true }: ListingCardProps) {
  const [imageErrored, setImageErrored] = useState(false);
  const safeSlug = listing.slug || listing.id;
  const baseHref = listing.tip === "tekne" ? `/tekneler/${safeSlug}` : `/konaklama/${safeSlug}`;
  const href = baseHref;
  const coverImage = listing.ilk_resim_url;
  const normalizedKonum = useMemo(
    () => formatKonum(undefined, listing.konum, listing.tip !== "tekne" ? "Fethiye" : undefined),
    [listing.konum, listing.tip],
  );
  const geceSayisi = selectedDates
    ? Math.max(
        0,
        Math.ceil(
          (dateFromYmdLocal(selectedDates.cikis).getTime() - dateFromYmdLocal(selectedDates.giris).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  const toplamFiyat = geceSayisi > 0 ? listing.gunluk_fiyat * geceSayisi : 0;

  const waText = encodeURIComponent(
    `Merhaba, ${listing.baslik} hakkında bilgi almak istiyorum.`,
  );
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

  return (
    <div className="flex h-full flex-col gap-2">
    <Link
      href={href}
      className="villa-card group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 text-inherit no-underline shadow-sm outline-offset-2 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#0e9aa7]/30 hover:shadow-xl hover:shadow-[#0e9aa7]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
    >
      <div className="card-image relative aspect-[4/3] shrink-0 overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-100 to-slate-200">
        {coverImage && !imageErrored ? (
          <Image
            src={coverImage}
            alt={fixTurkishDisplay(listing.baslik)}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            onError={() => setImageErrored(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-cyan-100 text-blue-300">
            <Home className="h-16 w-16" strokeWidth={1.5} />
            <span className="text-xs font-medium">Fotoğraf yakında</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {listing.sponsorlu ? (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
            >
              ⭐ Öne Çıkan
            </span>
          ) : null}
        </div>
        <HomeFavoriButon
          item={{
            id: listing.id,
            baslik: listing.baslik,
            konum: listing.konum,
            tip: listing.tip,
            slug: listing.slug || listing.id,
          }}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center justify-between rounded-xl bg-white/90 px-3 py-2 backdrop-blur-sm">
            <span className="text-xs font-medium text-gray-700">Detayları Gör</span>
            <ChevronRight size={14} className="text-sky-500" aria-hidden />
          </div>
        </div>
      </div>

      <div className="flex h-full flex-1 flex-col p-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <MapPin size={12} className="shrink-0 text-sky-400" />
            <span className="line-clamp-1">{fixTurkishDisplay(normalizedKonum)}</span>
          </div>

          <h3 className="mb-3 min-h-[2.5rem] line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-sky-600">
            {fixTurkishDisplay(listing.baslik)}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 sm:gap-4">
            {listing.yatak_odasi > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Bed size={14} className="text-gray-400" /> {listing.yatak_odasi} {listing.tip === "tekne" ? "kabin" : "oda"}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Bath size={14} className="text-gray-400" /> {listing.banyo} banyo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" /> {listing.kapasite} kişi
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-gray-100 pt-3">
          <div>
            <div className="mb-1 flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-gray-900">5.0</span>
              <span className="text-xs text-gray-400">(0)</span>
            </div>
            {listing.tip !== "tekne" && listing.ozellikler ? (
              <div className="flex flex-wrap gap-1">
                {listing.ozellikler.havuz ? (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-600">🏊</span>
                ) : null}
                {listing.ozellikler.wifi ? (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-600">📶</span>
                ) : null}
                {listing.ozellikler.deniz_manzarasi ? (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-600">🌊</span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="text-right">
            {geceSayisi > 0 ? (
              <div>
                <span className="text-lg font-black text-gray-900">{formatCurrency(toplamFiyat)}</span>
                <span className="block text-xs text-gray-400">{geceSayisi} gece toplam</span>
              </div>
            ) : (
              <div>
                <span className="text-lg font-black text-gray-900">{formatCurrency(listing.gunluk_fiyat)}</span>
                <span className="text-xs text-gray-400"> / gece</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
      {showWhatsappCta ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-1 text-sm font-medium text-green-600 hover:text-green-700"
        >
          <MessageCircle size={14} aria-hidden />
          WhatsApp ile fiyat al
        </a>
      ) : null}
    </div>
  );
}
