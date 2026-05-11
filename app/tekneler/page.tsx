"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CatalogHeroWave } from "@/components/catalog-hero-wave";
import { ListingReveal } from "@/components/listing-reveal";
import { TekneFiltreSidebar } from "@/components/tekne-filtre-sidebar";
import { TekneKarti } from "@/components/tekne-karti";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { defaultTekneFiltre, type TekneFiltre } from "@/lib/villa-sabitleri";

type TekneRow = {
  id: string;
  slug: string | null;
  baslik: string;
  konum: string;
  gunluk_fiyat: number;
  kapasite: number;
  yatak_odasi: number;
  ozellikler: unknown;
  sponsorlu: boolean;
  olusturulma_tarihi: string;
  ilan_medyalari?: Array<{ url: string; sira: number; tip: string }> | null;
};

function parseEtiketler(ozellikler: unknown): string[] {
  if (Array.isArray(ozellikler)) {
    return ozellikler.filter((item): item is string => typeof item === "string");
  }
  if (!ozellikler || typeof ozellikler !== "object") return [];
  const row = ozellikler as Record<string, unknown>;
  const etiketler = row.etiketler;
  if (Array.isArray(etiketler)) {
    return etiketler.filter((item): item is string => typeof item === "string");
  }
  return Object.keys(row).filter((key) => row[key] === true);
}

const SkeletonTekne = () => (
  <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
    <div className="skeleton h-[220px] w-full rounded-none" />
    <div className="space-y-3 p-4">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton mt-4 h-8 w-28 rounded-lg" />
    </div>
  </div>
);

export default function TeknelerPage() {
  const [tekneler, setTekneler] = useState<TekneRow[]>([]);
  const [filtre, setFiltre] = useState<TekneFiltre>(defaultTekneFiltre);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mobilFiltre, setMobilFiltre] = useState(false);
  const [baslangicTarihi, setBaslangicTarihi] = useState("");
  const [sure, setSure] = useState("1");
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const bugunIso = new Date().toISOString().split("T")[0];

  const fetchTekneler = async (f: TekneFiltre) => {
    setYukleniyor(true);
    const supabase = createClient();
    let query = supabase
      .from("ilanlar")
      .select("id, slug, baslik, konum, gunluk_fiyat, kapasite, yatak_odasi, ozellikler, sponsorlu, olusturulma_tarihi, ilan_medyalari(url, sira, tip)")
      .eq("aktif", true)
      .eq("tip", "tekne")
      .gte("gunluk_fiyat", Number(f.minFiyat) || 0)
      .lte("gunluk_fiyat", Number(f.maxFiyat) || 50000);

    if (f.minKapasite > 1) query = query.gte("kapasite", f.minKapasite);
    if (f.liman.length > 0) {
      const limanFiltre = f.liman.map((l) => `konum.ilike.%${l.split(",")[0].trim()}%`).join(",");
      query = query.or(limanFiltre);
    }
    switch (f.siralama) {
      case "fiyat_artan":
        query = query.order("gunluk_fiyat", { ascending: true });
        break;
      case "fiyat_azalan":
        query = query.order("gunluk_fiyat", { ascending: false });
        break;
      case "kapasite_buyuk":
        query = query.order("kapasite", { ascending: false });
        break;
      default:
        query = query.order("sponsorlu", { ascending: false }).order("olusturulma_tarihi", { ascending: false });
        break;
    }

    const { data } = await query;
    const rows = ((data as TekneRow[]) ?? []).filter((row) => {
      const etiketler = parseEtiketler(row.ozellikler);
      const hasSure = f.sure.length === 0 || f.sure.every((sure) => etiketler.includes(sure));
      const hasOzellik = f.ozellikler.length === 0 || f.ozellikler.every((oz) => etiketler.includes(oz));
      const hasTip = f.tekne_tipi.length === 0 || f.tekne_tipi.some((tip) => etiketler.includes(tip));
      return hasSure && hasOzellik && hasTip;
    });
    setTekneler(rows);
    setYukleniyor(false);
  };

  useEffect(() => {
    void fetchTekneler(filtre);
  }, [filtre]);

  const aktifFiltreSayisi = [
    ...filtre.liman,
    ...filtre.tekne_tipi,
    ...filtre.sure,
    ...filtre.ozellikler,
    ...(filtre.minFiyat > 0 || filtre.maxFiyat < 15000 ? ["fiyat"] : []),
    ...(filtre.minKapasite > 1 ? ["kapasite"] : []),
  ].length;

  const kartAnahtari = [
    filtre.liman.join(","),
    filtre.tekne_tipi.join(","),
    filtre.sure.join(","),
    filtre.ozellikler.join(","),
    filtre.siralama,
    filtre.minFiyat,
    filtre.maxFiyat,
    filtre.minKapasite,
  ].join("|");

  return (
    <div className="min-h-0 w-full space-y-6 overflow-x-hidden py-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e9aa7] via-[#0b8f9c] to-[#185FA5] px-6 py-10 text-white shadow-lg md:px-10 md:py-12">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-cyan-300/15 blur-2xl" aria-hidden />
        <div className="relative z-[1] max-w-3xl">
          <p className="mb-2 text-[13px] text-white/75">Ana Sayfa / Tekneler</p>
          <h1 className="mb-3 text-3xl font-medium tracking-tight md:text-5xl md:leading-tight">Fethiye Tekne Kiralama</h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            {tekneler.length}+ tekne ile hayalinizdeki deniz tatilini bulun
          </p>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {["Günlük / Haftalık", "Mürettebatlı Seçenekler", "TURSAB Güvencesi"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-md"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="relative z-[1] mt-4 md:mt-6">
          <CatalogHeroWave fillBottom="#ffffff" />
        </div>
      </div>

      <section
        className="overflow-visible rounded-2xl px-4 py-5 shadow-lg md:px-6 md:py-6"
        style={{
          background: "linear-gradient(120deg, #0F6E56 0%, #0c4a6e 55%, #185FA5 100%)",
        }}
      >
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/75">Tarih ve kiralama</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-3">
          <div
            className={`flex min-h-[52px] flex-1 flex-col justify-center rounded-xl border border-white/80 bg-white px-4 py-3 shadow-md ${
              baslangicTarihi ? "ring-2 ring-[#1D9E75]/75 ring-offset-2 ring-offset-transparent" : ""
            }`}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Başlangıç tarihi</p>
            <input
              type="date"
              value={baslangicTarihi}
              min={bugunIso}
              onChange={(e) => setBaslangicTarihi(e.target.value)}
              className="mt-1 w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none"
            />
          </div>
          <div className="flex min-h-[52px] flex-1 flex-col justify-center rounded-xl border border-white/80 bg-white px-4 py-3 shadow-md">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Kiralama süresi</p>
            <select
              value={sure}
              onChange={(e) => setSure(e.target.value)}
              className="mt-1 w-full cursor-pointer bg-transparent text-[15px] font-medium text-slate-900 outline-none"
            >
              <option value="1">Günlük</option>
              <option value="3">3 Günlük</option>
              <option value="7">Haftalık</option>
              <option value="14">2 Haftalık</option>
            </select>
          </div>
          <div className="flex min-h-[52px] flex-1 flex-col justify-center rounded-xl border border-white/80 bg-white px-4 py-3 shadow-md">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Kişi sayısı</p>
            <select
              value={kisiSayisi}
              onChange={(e) => setKisiSayisi(Number(e.target.value))}
              className="mt-1 w-full cursor-pointer bg-transparent text-[15px] font-medium text-slate-900 outline-none"
            >
              {[2, 4, 6, 8, 10, 12, 15].map((n) => (
                <option key={n} value={n}>
                  {n} Kişi
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() =>
              setFiltre({
                ...filtre,
                minKapasite: kisiSayisi,
                sure: sure === "7" || sure === "14" ? ["haftalik"] : ["gunluk"],
              })
            }
            className="inline-flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1D9E75] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/20 transition-transform hover:brightness-110 active:scale-[0.98] md:w-auto md:min-w-[160px] md:self-stretch"
          >
            <Search className="h-5 w-5" aria-hidden />
            Tekne Ara
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <button
          type="button"
          onClick={() => setMobilFiltre(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1D9E75]/40 bg-white px-4 py-3 text-sm font-semibold text-[#1D9E75] shadow-sm lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrele
          {aktifFiltreSayisi > 0 ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1D9E75] px-1.5 text-xs text-white">
              {aktifFiltreSayisi}
            </span>
          ) : null}
        </button>

        <div className="hidden lg:block">
          <TekneFiltreSidebar
            filtre={filtre}
            onChange={(f) => setFiltre(f)}
            onTemizle={() => setFiltre(defaultTekneFiltre)}
            sonucSayisi={tekneler.length}
          />
        </div>

        {mobilFiltre ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setMobilFiltre(false)} aria-label="Kapat" />
            <div className="absolute right-0 top-0 bottom-0 flex w-[min(100%,22rem)] flex-col overflow-y-auto rounded-l-2xl border-l border-slate-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-semibold text-slate-900">Filtreler</h3>
                <button type="button" onClick={() => setMobilFiltre(false)} className="rounded-full p-2 hover:bg-slate-100">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <TekneFiltreSidebar
                filtre={filtre}
                onChange={(f) => setFiltre(f)}
                onTemizle={() => setFiltre(defaultTekneFiltre)}
                sonucSayisi={tekneler.length}
              />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-slate-500">
              <span className="font-semibold text-slate-800">{tekneler.length}</span> tekne listeleniyor
            </p>
            <select
              value={filtre.siralama}
              onChange={(e) => setFiltre({ ...filtre, siralama: e.target.value as TekneFiltre["siralama"] })}
              className="w-full cursor-pointer rounded-xl border border-[#185FA5]/25 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition-shadow focus:border-[#185FA5]/50 focus:ring-2 focus:ring-[#185FA5]/15 sm:w-auto sm:min-w-[220px]"
            >
              <option value="onerilen">Önerilen Sıra</option>
              <option value="fiyat_artan">Fiyat: Düşükten Yükseğe</option>
              <option value="fiyat_azalan">Fiyat: Yüksekten Düşüğe</option>
              <option value="kapasite_buyuk">En Büyük Kapasite</option>
            </select>
          </div>

          <div className={`transition-opacity duration-300 ${yukleniyor ? "opacity-90" : "opacity-100"}`} key={kartAnahtari}>
            {yukleniyor ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <SkeletonTekne key={i} />
                ))}
              </div>
            ) : null}

            {!yukleniyor && tekneler.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                  <span className="text-3xl" aria-hidden>
                    ⚓
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-medium text-slate-800">Tekne bulunamadı</h3>
                <p className="mb-5 text-sm text-slate-500">Farklı filtre kriterleri deneyin</p>
                <button
                  type="button"
                  onClick={() => setFiltre(defaultTekneFiltre)}
                  className="rounded-xl border-2 border-[#1D9E75] bg-white px-6 py-2.5 text-sm font-semibold text-[#1D9E75] transition-colors hover:bg-[#1D9E75] hover:text-white"
                >
                  Filtreleri temizle
                </button>
              </div>
            ) : null}

            {!yukleniyor && tekneler.length > 0 ? (
              <ListingReveal className="grid grid-cols-1 gap-6 md:grid-cols-2" staggerMs={50}>
                {tekneler.map((tekne) => (
                  <TekneKarti key={tekne.id} tekne={tekne} />
                ))}
              </ListingReveal>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
