"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { IlanListeKarti } from "@/components/ilan-liste-karti";
import { ListingReveal } from "@/components/listing-reveal";
import { SearchForm } from "@/components/search-form";
import { VillaFiltreSidebar } from "@/components/villa-filtre-sidebar";
import { aramaStore } from "@/lib/arama-store";
import { parseGuestParam, parseListingDateParam } from "@/lib/listing-search-params";
import { KATEGORILER, OZELLIKLER } from "@/lib/villa-sabitleri";
import { isCatalogSchemaError } from "@/lib/catalog-queries";
import { getCatalogSupabase } from "@/lib/catalog-supabase";
import { dateFromYmdLocal, istanbulDateString } from "@/lib/tr-today";
import { defaultFiltre, type VillaFiltre } from "@/types/filtre";
import { isPublishedListing, LISTING_ONAY_DURUMU } from "@/lib/listing-approval";
import { isExcludedDraftListing } from "@/lib/utils/excluded-draft-listing";
import type { Ilan } from "@/types/supabase";

type ListingRow = Ilan & { ilan_medyalari?: Array<{ url: string; sira: number }> | null };

const SkeletonKart = () => (
  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
    <div className="skeleton h-[240px] w-full rounded-none" />
    <div className="space-y-3 p-4">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-2/3" />
      <div className="mt-4 flex justify-between gap-3">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
    </div>
  </div>
);

function withCoverImage(rows: ListingRow[]): Ilan[] {
  return rows.map((row) => {
    const medyaKapak =
      row.ilan_medyalari && row.ilan_medyalari.length
        ? [...row.ilan_medyalari].sort((a, b) => a.sira - b.sira)[0]?.url ?? null
        : null;
    return {
      ...row,
      ilk_resim_url: row.ilk_resim_url ?? medyaKapak ?? null,
    };
  });
}

function extractTags(ozellikler: unknown): string[] {
  if (Array.isArray(ozellikler)) return ozellikler.filter((item): item is string => typeof item === "string");
  if (!ozellikler || typeof ozellikler !== "object") return [];
  const row = ozellikler as Record<string, unknown>;
  const etiketler = row.etiketler;
  if (Array.isArray(etiketler)) return etiketler.filter((item): item is string => typeof item === "string");
  return Object.keys(row).filter((key) => row[key] === true);
}

function formatTarihChip(ymd: string) {
  const d = dateFromYmdLocal(ymd);
  if (Number.isNaN(d.getTime())) return ymd;
  return format(d, "d MMM yyyy", { locale: tr });
}

function KonaklamaListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlGiris = parseListingDateParam(searchParams.get("giris"));
  const urlCikis = parseListingDateParam(searchParams.get("cikis"));
  const yetiskin = parseGuestParam(searchParams.get("yetiskin"), 2);
  const cocuk = parseGuestParam(searchParams.get("cocuk"), 0);
  const bebek = parseGuestParam(searchParams.get("bebek"), 0);
  const hasDateFilter = Boolean(urlGiris && urlCikis);

  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [filtre, setFiltre] = useState<VillaFiltre>(defaultFiltre);
  const [mobilFiltre, setMobilFiltre] = useState(false);
  const [loading, setLoading] = useState(true);
  const bugunIso = useMemo(() => istanbulDateString(), []);

  const aramaTarihleri = useMemo(() => {
    if (hasDateFilter) {
      const geceSayisi = Math.max(
        0,
        Math.ceil(
          (dateFromYmdLocal(urlCikis).getTime() - dateFromYmdLocal(urlGiris).getTime()) / 86400000,
        ),
      );
      return { giris: urlGiris, cikis: urlCikis, geceSayisi };
    }
    return { giris: "", cikis: "", geceSayisi: 0 };
  }, [hasDateFilter, urlCikis, urlGiris]);

  const { giris, cikis, geceSayisi } = aramaTarihleri;

  const clearDateFilter = useCallback(() => {
    aramaStore.clearDates();
    router.replace("/konaklama");
  }, [router]);

  useEffect(() => {
    if (hasDateFilter) {
      aramaStore.save({
        giris: urlGiris,
        cikis: urlCikis,
        yetiskin,
        cocuk,
        bebek,
        tip: "villa",
      });
    } else {
      aramaStore.clearDates();
    }
  }, [hasDateFilter, urlGiris, urlCikis, yetiskin, cocuk, bebek]);
  const bolgeKey = useMemo(() => filtre.bolge.join("|"), [filtre.bolge]);
  const kategoriKey = useMemo(() => filtre.kategori.join("|"), [filtre.kategori]);
  const ozellikKey = useMemo(() => filtre.ozellikler.join("|"), [filtre.ozellikler]);

  const listeAnimasyonAnahtari = useMemo(
    () =>
      [
        bolgeKey,
        kategoriKey,
        ozellikKey,
        filtre.minFiyat,
        filtre.maxFiyat,
        filtre.minKisi,
        filtre.minYatakOdasi,
        filtre.minBanyo,
        filtre.siralama,
        geceSayisi,
      ].join("|"),
    [
      bolgeKey,
      kategoriKey,
      ozellikKey,
      filtre.minFiyat,
      filtre.maxFiyat,
      filtre.minKisi,
      filtre.minYatakOdasi,
      filtre.minBanyo,
      filtre.siralama,
      geceSayisi,
    ],
  );

  const fetchIlanlar = useCallback(
    async (
      aktifFiltre: VillaFiltre,
      tarih: { giris: string; cikis: string; geceSayisi: number },
      signal?: AbortSignal,
    ) => {
    const supabase = getCatalogSupabase();
    const aktifGeceSayisi = tarih.geceSayisi;

    const buildFilteredQuery = (withOnay: boolean, skipSponsorluOrder: boolean) => {
      let query = supabase
        .from("ilanlar")
        .select("*, ilan_medyalari(url,sira,tip)")
        .eq("aktif", true)
        .eq("tip", "villa");
      if (withOnay) query = query.eq("onay_durumu", LISTING_ONAY_DURUMU.PUBLISHED);

      if (aktifFiltre.bolge.length > 0) {
        const bolgeFiltre = aktifFiltre.bolge.map((b) => `konum.ilike.%${b.split(",")[0].trim()}%`).join(",");
        query = query.or(bolgeFiltre);
      }

      if (aktifGeceSayisi > 1) {
        const maxGecelik = Math.ceil((Number(aktifFiltre.maxFiyat) || 50000) / aktifGeceSayisi);
        const minGecelik = Math.floor((Number(aktifFiltre.minFiyat) || 0) / aktifGeceSayisi);
        query = query.gte("gunluk_fiyat", minGecelik).lte("gunluk_fiyat", maxGecelik);
      } else {
        query = query
          .gte("gunluk_fiyat", Number(aktifFiltre.minFiyat) || 0)
          .lte("gunluk_fiyat", Number(aktifFiltre.maxFiyat) || 50000);
      }
      if (aktifFiltre.minKisi > 1) query = query.gte("kapasite", aktifFiltre.minKisi);
      if (aktifFiltre.minYatakOdasi > 1) query = query.gte("yatak_odasi", aktifFiltre.minYatakOdasi);
      if (aktifFiltre.minBanyo > 1) query = query.gte("banyo", aktifFiltre.minBanyo);

      if (aktifFiltre.kategori.length > 0) {
        const kategoriOr = aktifFiltre.kategori.map((kat) => `ozellikler->>kategori.eq.${kat}`).join(",");
        query = query.or(kategoriOr);
      }
      if (aktifFiltre.ozellikler.length > 0) {
        aktifFiltre.ozellikler.forEach((oz) => {
          query = query.contains("ozellikler", { etiketler: [oz] });
        });
      }

      switch (aktifFiltre.siralama) {
        case "fiyat_artan":
          query = query.order("gunluk_fiyat", { ascending: true });
          break;
        case "fiyat_azalan":
          query = query.order("gunluk_fiyat", { ascending: false });
          break;
        case "yeni_eklenen":
          query = query.order("olusturulma_tarihi", { ascending: false });
          break;
        case "kapasite_buyuk":
          query = query.order("kapasite", { ascending: false });
          break;
        default:
          if (skipSponsorluOrder) {
            query = query.order("olusturulma_tarihi", { ascending: false });
          } else {
            query = query.order("sponsorlu", { ascending: false }).order("olusturulma_tarihi", { ascending: false });
          }
      }
      return query;
    };

    const attempts: Array<{ withOnay: boolean; skipSponsorluOrder: boolean }> = [
      { withOnay: true, skipSponsorluOrder: false },
      { withOnay: true, skipSponsorluOrder: true },
      { withOnay: false, skipSponsorluOrder: true },
    ];

    let data: ListingRow[] | null = null;
    for (const attempt of attempts) {
      const res = await buildFilteredQuery(attempt.withOnay, attempt.skipSponsorluOrder);
      if (signal?.aborted) return;
      if (!res.error) {
        data = (res.data ?? []) as ListingRow[];
        break;
      }
      if (!isCatalogSchemaError(res.error)) {
        console.error("[konaklama]", res.error);
        break;
      }
    }
    if (signal?.aborted) return;
    if (!data) return;

    let rows = withCoverImage(data)
      .filter((row) => !isExcludedDraftListing(row))
      .filter((row) => isPublishedListing(row));

    if (tarih.giris && tarih.cikis) {
      const [musaitlikRes, rezervasyonRes] = await Promise.all([
        supabase
          .from("musaitlik")
          .select("ilan_id")
          .gte("tarih", tarih.giris)
          .lt("tarih", tarih.cikis)
          .eq("durum", "dolu"),
        supabase
          .from("rezervasyonlar")
          .select("ilan_id")
          .in("durum", ["beklemede", "onaylandi"])
          .lt("giris_tarihi", tarih.cikis)
          .gt("cikis_tarihi", tarih.giris),
      ]);
      if (signal?.aborted) return;

      const doluIds = new Set<string>();
      (musaitlikRes.data ?? []).forEach((row) => {
        if (row.ilan_id) doluIds.add(String(row.ilan_id));
      });
      (rezervasyonRes.data ?? []).forEach((row) => {
        if (row.ilan_id) doluIds.add(String(row.ilan_id));
      });
      if (doluIds.size > 0) {
        rows = rows.filter((row) => !doluIds.has(row.id));
      }
    }

    setIlanlar(rows);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void fetchIlanlar(filtre, aramaTarihleri, controller.signal).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [
    fetchIlanlar,
    aramaTarihleri.giris,
    aramaTarihleri.cikis,
    aramaTarihleri.geceSayisi,
    bolgeKey,
    kategoriKey,
    ozellikKey,
    filtre.maxFiyat,
    filtre.maxKisi,
    filtre.maxYatakOdasi,
    filtre.minBanyo,
    filtre.minFiyat,
    filtre.minKisi,
    filtre.minYatakOdasi,
    filtre.siralama,
  ]);

  const aktifFiltreler = useMemo(
    () => [
      ...(hasDateFilter
        ? [
            {
              label: `${formatTarihChip(giris)} — ${formatTarihChip(cikis)}`,
              key: "tarih",
              value: "",
            },
          ]
        : []),
      ...filtre.bolge.map((b) => ({ label: b, key: "bolge", value: b })),
      ...filtre.kategori.map((k) => ({
        label: KATEGORILER.find((kat) => kat.value === k)?.label ?? k,
        key: "kategori",
        value: k,
      })),
      ...filtre.ozellikler.map((o) => ({
        label: OZELLIKLER.find((oz) => oz.value === o)?.label ?? o,
        key: "ozellikler",
        value: o,
      })),
      ...(filtre.minFiyat > 0 || filtre.maxFiyat < 50000
        ? [{ label: `₺${filtre.minFiyat}-₺${filtre.maxFiyat}`, key: "fiyat", value: "" }]
        : []),
      ...(filtre.minKisi > 1 ? [{ label: `${filtre.minKisi}+ kişi`, key: "kisi", value: "" }] : []),
      ...(filtre.minYatakOdasi > 1 ? [{ label: `${filtre.minYatakOdasi}+ oda`, key: "oda", value: "" }] : []),
    ],
    [filtre, cikis, giris, hasDateFilter],
  );

  const aktifFiltreSayisi = useMemo(() => {
    let count = filtre.bolge.length + filtre.kategori.length + filtre.ozellikler.length;
    if (hasDateFilter) count += 1;
    if (filtre.minFiyat > 0 || filtre.maxFiyat < 50000) count += 1;
    if (filtre.minKisi > 1) count += 1;
    if (filtre.minYatakOdasi > 1) count += 1;
    return count;
  }, [filtre, hasDateFilter]);

  const filtreKaldir = useCallback(
    (key: string, value: string) => {
      if (key === "tarih") {
        clearDateFilter();
        return;
      }
      if (key === "bolge") setFiltre((prev) => ({ ...prev, bolge: prev.bolge.filter((b) => b !== value) }));
      if (key === "kategori") setFiltre((prev) => ({ ...prev, kategori: prev.kategori.filter((k) => k !== value) }));
      if (key === "ozellikler") setFiltre((prev) => ({ ...prev, ozellikler: prev.ozellikler.filter((o) => o !== value) }));
      if (key === "fiyat") setFiltre((prev) => ({ ...prev, minFiyat: defaultFiltre.minFiyat, maxFiyat: defaultFiltre.maxFiyat }));
      if (key === "kisi") setFiltre((prev) => ({ ...prev, minKisi: defaultFiltre.minKisi }));
      if (key === "oda") setFiltre((prev) => ({ ...prev, minYatakOdasi: defaultFiltre.minYatakOdasi }));
    },
    [clearDateFilter],
  );

  const tumFiltreleriTemizle = useCallback(() => {
    setFiltre(defaultFiltre);
    clearDateFilter();
  }, [clearDateFilter]);

  return (
    <div className="min-h-0 w-full space-y-6 overflow-x-hidden py-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#0F6E56] px-6 py-10 text-white shadow-lg md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" aria-hidden />
        <div className="relative z-[1] max-w-3xl">
          <p className="mb-2 text-[13px] text-white/75">Ana Sayfa / Konaklama</p>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl md:leading-tight">Fethiye Villa Kiralama</h1>
          <p className="max-w-xl text-base leading-relaxed text-emerald-50 md:text-lg">
            Lüks villalar, aile evleri ve butik konaklama seçenekleri
          </p>
        </div>
      </section>

      <section className="border-y border-[#E2E8F0] bg-white py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">Tarih ve misafir</p>
          <div className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-sm">
            <SearchForm
              bugunIso={bugunIso}
              embedded
              initialGiris={hasDateFilter ? giris : undefined}
              initialCikis={hasDateFilter ? cikis : undefined}
              initialYetiskin={yetiskin}
              initialCocuk={cocuk}
              initialBebek={bebek}
            />
            {hasDateFilter ? (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Tarihi temizle
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <button
        onClick={() => setMobilFiltre(true)}
        className="mb-1 flex w-full items-center justify-center gap-2 rounded-xl border border-[#1D9E75]/40 bg-white px-4 py-3 text-sm font-semibold text-[#1D9E75] shadow-sm lg:hidden"
        type="button"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtrele
        {aktifFiltreSayisi > 0 ? (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1D9E75] px-1.5 text-xs text-white">
            {aktifFiltreSayisi}
          </span>
        ) : null}
      </button>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="hidden lg:block">
          <VillaFiltreSidebar
            filtre={filtre}
            onChange={setFiltre}
            onTemizle={tumFiltreleriTemizle}
            sonucSayisi={ilanlar.length}
            geceSayisi={geceSayisi}
          />
        </div>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-slate-500">
              <span className="font-semibold text-slate-800">{ilanlar.length}</span> villa listeleniyor
            </p>
            <select
              value={filtre.siralama}
              onChange={(e) => setFiltre({ ...filtre, siralama: e.target.value as VillaFiltre["siralama"] })}
              className="w-full cursor-pointer rounded-xl border border-[#185FA5]/25 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition-shadow focus:border-[#185FA5]/50 focus:ring-2 focus:ring-[#185FA5]/15 sm:w-auto sm:min-w-[220px]"
            >
              <option value="onerilen">Önerilen Sıra</option>
              <option value="fiyat_artan">Fiyat: Düşükten Yükseğe</option>
              <option value="fiyat_azalan">Fiyat: Yüksekten Düşüğe</option>
              <option value="yeni_eklenen">En Yeni Eklenen</option>
              <option value="kapasite_buyuk">En Büyük Kapasite</option>
            </select>
          </div>

          {aktifFiltreler.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {aktifFiltreler.map((f, i) => (
                <span
                  key={`${f.key}-${f.value}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#1D9E75]/25 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-900"
                >
                  {f.label}
                  <button onClick={() => filtreKaldir(f.key, f.value)} type="button" className="rounded-full p-0.5 hover:bg-white/80">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={tumFiltreleriTemizle}
                className="self-center text-xs text-slate-400 underline hover:text-slate-600"
                type="button"
              >
                Tümünü temizle
              </button>
            </div>
          ) : null}

          <div
            className={`transition-opacity duration-300 ${loading ? "opacity-90" : "opacity-100"}`}
            key={listeAnimasyonAnahtari}
          >
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <SkeletonKart key={i} />
                ))}
              </div>
            ) : ilanlar.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                  <Search className="h-7 w-7 text-[#185FA5]/50" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-medium text-slate-800">Kriterlere uygun villa bulunamadı</h3>
                <p className="mb-5 max-w-sm text-sm text-slate-500">Filtreleri veya tarih aralığını değiştirerek tekrar deneyin.</p>
                <button
                  onClick={tumFiltreleriTemizle}
                  className="rounded-xl border-2 border-[#1D9E75] bg-white px-6 py-2.5 text-sm font-semibold text-[#1D9E75] transition-colors hover:bg-[#1D9E75] hover:text-white"
                  type="button"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <ListingReveal className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" staggerMs={50}>
                {ilanlar.map((listing) => (
                  <IlanListeKarti
                    key={listing.id}
                    id={listing.id}
                    slug={listing.slug ?? listing.id}
                    baslik={listing.baslik}
                    konum={listing.konum ?? ""}
                    fiyat={listing.gunluk_fiyat}
                    tip="villa"
                    oda_sayisi={listing.yatak_odasi}
                    banyo_sayisi={listing.banyo}
                    kapasite={listing.kapasite}
                    puan={listing.ortalama_puan ?? 0}
                    yorum_sayisi={listing.yorum_sayisi ?? 0}
                    fotograflar={listing.ilk_resim_url ? [listing.ilk_resim_url] : []}
                    one_cikan={listing.sponsorlu}
                    ozellikler={extractTags(listing.ozellikler)}
                    geceSayisi={geceSayisi}
                    giris={giris}
                    cikis={cikis}
                    yetiskin={yetiskin}
                    cocuk={cocuk}
                    bebek={bebek}
                  />
                ))}
              </ListingReveal>
            )}
          </div>
        </main>
      </div>

      {mobilFiltre ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setMobilFiltre(false)} type="button" aria-label="Kapat" />
          <div className="absolute right-0 top-0 bottom-0 flex w-[min(100%,22rem)] flex-col overflow-y-auto rounded-l-2xl border-l border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900">Filtreler</h3>
              <button onClick={() => setMobilFiltre(false)} type="button" className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <VillaFiltreSidebar
              filtre={filtre}
              onChange={setFiltre}
              onTemizle={tumFiltreleriTemizle}
              sonucSayisi={ilanlar.length}
              geceSayisi={geceSayisi}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KonaklamaPageFallback() {
  return (
    <div className="min-h-0 w-full space-y-6 overflow-x-hidden py-6">
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonKart key={i} />
        ))}
      </div>
    </div>
  );
}

export default function KonaklamaPage() {
  return (
    <Suspense fallback={<KonaklamaPageFallback />}>
      <KonaklamaListingsContent />
    </Suspense>
  );
}
