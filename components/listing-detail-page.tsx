import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, CheckCircle2, ChevronRight, Phone, Star, X, XCircle } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { ListingHeaderActions } from "@/components/listing-header-actions";
import { ListingGallery } from "@/components/listing-gallery";
import { ListingMapSection } from "@/components/listing-map-section";
import { PriceCalculator } from "@/components/price-calculator";
import { ListingQuestionForm } from "@/components/listing-detail-extras";
import { RecentListingsTracker } from "@/components/recent-listings-tracker";
import { RezervasyonBaslatButton } from "@/components/rezervasyon-baslat-button";
import { getListingBySlug } from "@/lib/data/phase2";
import { OZELLIKLER } from "@/lib/villa-sabitleri";
import { reservationUrlSegmentFromListing } from "@/lib/rezervasyon-segment";
import { getPlatformSettings } from "@/lib/settings";
import { dateFromYmdLocal, istanbulDateString } from "@/lib/tr-today";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import { TURSAB_NO } from "@/lib/constants";

type ListingDetailPageProps = {
  tip: "villa" | "tekne";
  slug: string;
  selectedDates?: {
    giris?: string;
    cikis?: string;
    yetiskin?: string;
    cocuk?: string;
    bebek?: string;
  };
};

function nightsFromUrl(giris?: string, cikis?: string) {
  if (!giris?.trim() || !cikis?.trim()) return 0;
  return Math.max(
    0,
    Math.ceil(
      (dateFromYmdLocal(cikis).getTime() - dateFromYmdLocal(giris).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}

function addDaysToIso(baseIso: string, dayOffset: number) {
  const value = new Date(`${baseIso}T00:00:00`);
  value.setDate(value.getDate() + dayOffset);
  return value.toISOString().slice(0, 10);
}

export async function ListingDetailPage({ tip, slug, selectedDates }: ListingDetailPageProps) {
  const [detail, settings] = await Promise.all([
    getListingBySlug(tip, slug),
    getPlatformSettings(),
  ]);
  if (!detail) notFound();
  const yetiskin = Number(selectedDates?.yetiskin ?? 2);
  const cocuk = Number(selectedDates?.cocuk ?? 0);
  const bebek = Number(selectedDates?.bebek ?? 0);
  const rezervasyonKey = reservationUrlSegmentFromListing(detail.listing.slug, detail.listing.id);
  const bugunIso = istanbulDateString();
  const fallbackGiris = selectedDates?.giris ?? bugunIso;
  const fallbackCikis = selectedDates?.cikis ?? addDaysToIso(fallbackGiris, 1);
  const safeGiris = fallbackGiris;
  const safeCikis =
    fallbackCikis > fallbackGiris ? fallbackCikis : addDaysToIso(fallbackGiris, 1);

  const urlGece = nightsFromUrl(safeGiris, safeCikis);
  const temizlikUcreti = detail.listing.temizlik_ucreti ?? 0;
  const urlToplamBasit = urlGece > 0 ? urlGece * (detail.listing.gunluk_fiyat ?? 0) + temizlikUcreti : 0;
  const similarDateQuery =
    safeGiris && safeCikis
      ? {
          giris: safeGiris,
          cikis: safeCikis,
          yetiskin: Number(selectedDates?.yetiskin ?? 2),
          cocuk: Number(selectedDates?.cocuk ?? 0),
        }
      : undefined;

  const totalScore = (detail.comments as Array<{ puan?: number | string | null }>).reduce<number>(
    (sum, row) => sum + Number(row.puan ?? 0),
    0,
  );
  const averageScore = detail.comments.length > 0 ? totalScore / detail.comments.length : 0;

  const coverImage =
    detail.media[0]?.url ??
    (tip === "tekne" ? "/images/tekne-placeholder.svg" : "/images/villa-placeholder.svg");
  const listingSlug = detail.listing.slug ?? detail.listing.id;

  const waDigits = settings.whatsappNumber.replace(/\D/g, "");
  const waMesaj = encodeURIComponent(
    `Merhaba, ${fixTurkishDisplay(detail.listing.baslik)} hakkında bilgi almak istiyorum.`,
  );
  const waLink = `https://wa.me/${waDigits}?text=${waMesaj}`;
  const bolgeAdi = fixTurkishDisplay(detail.listing.konum.split(",")[0]?.trim() || detail.listing.konum);
  const ozellikKaynak = detail.listing.ozellikler as unknown;
  const etiketler = Array.isArray(ozellikKaynak)
    ? ozellikKaynak.filter((x): x is string => typeof x === "string")
    : (ozellikKaynak && typeof ozellikKaynak === "object" && Array.isArray((ozellikKaynak as { etiketler?: unknown[] }).etiketler)
        ? (ozellikKaynak as { etiketler: unknown[] }).etiketler.filter((x): x is string => typeof x === "string")
        : Object.entries((ozellikKaynak ?? {}) as Record<string, unknown>)
            .filter(([, value]) => value === true)
            .map(([key]) => key));
  return (
    <div className="w-full space-y-8 overflow-x-hidden pb-24 xl:pb-0">
      <RecentListingsTracker
        entry={{
          id: detail.listing.id,
          slug: listingSlug,
          tip,
          baslik: detail.listing.baslik,
          konum: detail.listing.konum,
          gunluk_fiyat: detail.listing.gunluk_fiyat,
          image: coverImage,
        }}
      />
      <section className="space-y-3">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
          <Link href="/" className="transition-colors hover:text-[#0e9aa7]">
            Ana Sayfa
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          <Link href="/konaklama" className="transition-colors hover:text-[#0e9aa7]">
            Konaklama
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          <Link href={`/konaklama?bolge=${encodeURIComponent(bolgeAdi)}`} className="transition-colors hover:text-[#0e9aa7]">
            {bolgeAdi}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1 font-medium text-slate-600">{fixTurkishDisplay(detail.listing.baslik)}</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">{fixTurkishDisplay(detail.listing.baslik)}</h1>
            <p className="text-slate-600">{fixTurkishDisplay(detail.listing.konum)}</p>
          </div>
          <ListingHeaderActions
            title={fixTurkishDisplay(detail.listing.baslik)}
            item={{
              id: detail.listing.id,
              baslik: detail.listing.baslik,
              konum: detail.listing.konum,
              tip,
              slug: listingSlug,
            }}
          />
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(detail.listing.gunluk_fiyat)} / gece</p>
            <p className="text-sm text-slate-600">
              {detail.comments.length > 0
                ? `${averageScore.toFixed(1)} puan (${detail.comments.length} yorum)`
                : "Henüz yorum yok"}
            </p>
          </div>
        </div>
      </section>

      <ListingGallery media={detail.media} />

      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">Özellikler</h2>
            <div className="my-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#f0fdfd] p-3 text-center">
                <span className="text-lg font-bold text-slate-800">{detail.listing.yatak_odasi}</span>
                <span className="mt-0.5 block text-xs text-slate-500">Oda</span>
              </div>
              <div className="rounded-xl bg-[#f0fdfd] p-3 text-center">
                <span className="text-lg font-bold text-slate-800">{detail.listing.banyo}</span>
                <span className="mt-0.5 block text-xs text-slate-500">Banyo</span>
              </div>
              <div className="rounded-xl bg-[#f0fdfd] p-3 text-center">
                <span className="text-lg font-bold text-slate-800">{detail.listing.kapasite}</span>
                <span className="mt-0.5 block text-xs text-slate-500">Kişi</span>
              </div>
            </div>
            {etiketler.length > 0 ? (
              <div className="mb-5 mt-2 flex flex-wrap gap-2">
                {etiketler.map((oz) => {
                  const ozDef = OZELLIKLER.find((item) => item.value === oz);
                  return ozDef ? (
                    <span
                      key={oz}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#0e9aa7]/20 bg-[#f0fdfd] px-3 py-1.5 text-xs font-medium text-[#0e9aa7]"
                    >
                      {ozDef.label}
                    </span>
                  ) : null;
                })}
              </div>
            ) : null}
            <p className="mt-3 text-sm text-slate-700">{fixTurkishDisplay(detail.listing.aciklama)}</p>
          </section>

          {tip === "villa" ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-green-700">
                    <CheckCircle2 size={18} className="text-green-500" aria-hidden />
                    Fiyata Dahil
                  </h4>
                  <ul className="space-y-2">
                    {["Hazirlik hizmeti", "Havlu ve carsaf", "WiFi", "Otopark"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check size={14} className="shrink-0 text-green-500" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-red-600">
                    <XCircle size={18} className="text-red-500" aria-hidden />
                    Fiyata Dahil Değil
                  </h4>
                  <ul className="space-y-2">
                    {["Elektrik (sezon disi)", "Transfer", "Ek hazirlik"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <X size={14} className="shrink-0 text-red-400" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Havuz Boyutu", "8m × 4m özel havuz"],
                      ["Havuz Isıtma", "Isıtmalı (Ekim-Nisan)"],
                      ["İnternet", "Fiber WiFi — 50 Mbps"],
                      ["Giriş", "14:00"],
                      ["Çıkış", "12:00"],
                      ["Minimum Kiralama", "3 Gece"],
                    ].map(([key, val]) => (
                      <tr key={String(key)} className="border-t border-gray-100 first:border-t-0">
                        <td className="w-1/3 bg-gray-50 px-4 py-3 font-medium text-gray-500">{key}</td>
                        <td className="px-4 py-3 text-gray-900">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
          <ListingMapSection label={fixTurkishDisplay(detail.listing.konum)} />
          <section className="rounded-2xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900">Yorumlar</h2>
            {detail.comments.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[#0e9aa7]/20 bg-[#f0fdfd] p-6 text-center">
                <Star className="mx-auto mb-3 h-10 w-10 text-[#0e9aa7]/30" />
                <p className="mb-1 font-medium text-slate-500">Henüz yorum yapılmamış</p>
                <p className="text-sm text-slate-400">İlk yorumu siz yazın!</p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-700">
                Ortalama puan: {averageScore.toFixed(1)} ({detail.comments.length} yorum)
              </p>
            )}
          </section>
          <section className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
            TURSAB Üyesidir - Belge No: {TURSAB_NO}
          </section>
          <ListingQuestionForm ilanBaslik={fixTurkishDisplay(detail.listing.baslik)} />
        </div>

        <div className="relative z-40 w-full self-start xl:w-96 xl:flex-shrink-0 xl:sticky xl:top-24">
          <div className="space-y-4">
          <div className="space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Rezervasyon</h3>
            {safeGiris && safeCikis ? (
              <p className="text-sm text-slate-600">
                Arama tarihleriniz seçili. Aşağıdaki hesaplayıcıda gecelik fiyat kuralları (sezon / özel günler)
                uygulanır; toplamı takvimden doğrulayabilirsiniz.
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Giriş — çıkış tarihlerini ve misafir sayısını aşağıdaki hesaplayıcıdan seçin veya arama sayfasından
                gelerek tarihleri tekrar seçebilirsiniz.
              </p>
            )}
            {safeGiris && safeCikis ? (
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-800">
                <div className="font-medium text-sky-900">
                  {format(dateFromYmdLocal(safeGiris), "d MMM", { locale: tr })} →{" "}
                  {format(dateFromYmdLocal(safeCikis), "d MMM yyyy", { locale: tr })}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {urlGece > 0 ? `${urlGece} gece (ozet, gecelik × gece)` : "Tarihleri kontrol edin"}
                </div>
                {urlGece > 0 && temizlikUcreti > 0 ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Temizlik ücreti dahil: {formatCurrency(temizlikUcreti)}
                  </div>
                ) : null}
                {urlGece > 0 ? (
                  <div className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(urlToplamBasit)}</div>
                ) : null}
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex justify-between gap-2">
                <span>Gecelik</span>
                <span className="font-semibold text-slate-900">{formatCurrency(detail.listing.gunluk_fiyat)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Kapasite: {detail.listing.kapasite} kişi</p>
            </div>
            {urlGece > 0 ? (
              <RezervasyonBaslatButton
                slug={rezervasyonKey}
                ilanTip={tip}
                giris={safeGiris}
                cikis={safeCikis}
                yetiskin={yetiskin}
                cocuk={cocuk}
                bebek={bebek}
                gunlukFiyat={detail.listing.gunluk_fiyat ?? 0}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 active:translate-y-0"
              >
                {`${formatCurrency(urlToplamBasit)} — Rezervasyon Yap →`}
              </RezervasyonBaslatButton>
            ) : (
              <RezervasyonBaslatButton
                slug={rezervasyonKey}
                ilanTip={tip}
                giris={safeGiris}
                cikis={safeCikis}
                yetiskin={yetiskin}
                cocuk={cocuk}
                bebek={bebek}
                gunlukFiyat={detail.listing.gunluk_fiyat ?? 0}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-4 text-lg font-bold text-slate-500 transition hover:bg-slate-200"
              >
                Önce Tarih Seçin
              </RezervasyonBaslatButton>
            )}
            <p className="text-center text-sm text-slate-500">Toplam fiyat tarih seçildikten sonra hesaplanır</p>
          </div>
          <PriceCalculator
            sectionId="fiyat-takvim"
            bugunIso={bugunIso}
            gunlukFiyat={detail.listing.gunluk_fiyat ?? 0}
            temizlikUcreti={temizlikUcreti}
            kapasite={detail.listing.kapasite ?? 1}
            availability={detail.availability}
            seasonPrices={detail.seasonPrices}
            reservations={detail.reservations}
            initialGiris={safeGiris}
            initialCikis={safeCikis}
          />
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Benzer İlanlar</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {detail.similar.map((listing) => (
            <ListingCard key={listing.id} listing={listing} selectedDates={similarDateQuery} />
          ))}
        </div>
      </section>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            {urlGece > 0 ? (
              <>
                <div className="truncate text-xl font-bold text-[#0e9aa7]">{formatCurrency(urlToplamBasit)}</div>
                <div className="text-xs text-gray-500">{urlGece} gece toplam</div>
              </>
            ) : (
              <>
                <div className="truncate text-xl font-bold text-[#0e9aa7]">{formatCurrency(detail.listing.gunluk_fiyat)}</div>
                <div className="text-xs text-gray-500">/ gece</div>
              </>
            )}
          </div>
          {urlGece > 0 ? (
            <RezervasyonBaslatButton
              slug={rezervasyonKey}
              ilanTip={tip}
              giris={safeGiris}
              cikis={safeCikis}
              yetiskin={yetiskin}
              cocuk={cocuk}
              bebek={bebek}
              gunlukFiyat={detail.listing.gunluk_fiyat ?? 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#0e9aa7] to-[#06b6d4] px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-[#0e9aa7]/25 transition-all active:scale-95"
            >
              {`${formatCurrency(urlToplamBasit)} — Rezervasyon`}
            </RezervasyonBaslatButton>
          ) : (
            <RezervasyonBaslatButton
              slug={rezervasyonKey}
              ilanTip={tip}
              giris={safeGiris}
              cikis={safeCikis}
              yetiskin={yetiskin}
              cocuk={cocuk}
              bebek={bebek}
              gunlukFiyat={detail.listing.gunluk_fiyat ?? 0}
              className="flex-1 rounded-xl bg-slate-100 py-3 text-center text-sm font-bold text-slate-500 transition hover:bg-slate-200"
            >
              Önce Tarih Seçin
            </RezervasyonBaslatButton>
          )}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-3"
            aria-label="WhatsApp"
          >
            <Phone size={18} aria-hidden />
          </a>
        </div>
      </div>
      <div className="pb-24 lg:pb-0" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            name: detail.listing.baslik,
            description: detail.listing.aciklama,
            address: {
              "@type": "PostalAddress",
              addressLocality: detail.listing.konum,
            },
          }),
        }}
      />
    </div>
  );
}
