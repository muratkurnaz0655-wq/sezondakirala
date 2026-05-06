"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { IlanListeKarti } from "@/components/ilan-liste-karti";
import { SearchForm } from "@/components/search-form";
import { VillaFiltreSidebar } from "@/components/villa-filtre-sidebar";
import { aramaStore } from "@/lib/arama-store";
import { KATEGORILER, OZELLIKLER } from "@/lib/villa-sabitleri";
import { createClient } from "@/lib/supabase/client";
import { dateFromYmdLocal, istanbulDateString } from "@/lib/tr-today";
import { defaultFiltre, type VillaFiltre } from "@/types/filtre";
import type { Ilan } from "@/types/supabase";

type ListingRow = Ilan & { ilan_medyalari?: Array<{ url: string; sira: number }> | null };

const SkeletonKart = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-100 animate-pulse">
    <div className="h-48 w-full bg-slate-200" />
    <div className="space-y-3 p-4">
      <div className="h-4 w-3/4 rounded-full bg-slate-200" />
      <div className="h-3 w-1/2 rounded-full bg-slate-200" />
      <div className="h-3 w-2/3 rounded-full bg-slate-200" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-6 w-24 rounded-full bg-slate-200" />
        <div className="h-9 w-20 rounded-xl bg-slate-200" />
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

export default function ListingsPage() {
  const currentArama = useSyncExternalStore(aramaStore.subscribe, aramaStore.get, aramaStore.get);
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [filtre, setFiltre] = useState<VillaFiltre>(defaultFiltre);
  const [mobilFiltre, setMobilFiltre] = useState(false);
  const [loading, setLoading] = useState(true);
  const [giris, setGiris] = useState<string>("");
  const [cikis, setCikis] = useState<string>("");
  const [geceSayisi, setGeceSayisi] = useState<number>(0);
  const yetiskin = currentArama?.yetiskin ?? 2;
  const cocuk = currentArama?.cocuk ?? 0;
  const bebek = currentArama?.bebek ?? 0;
  const bugunIso = useMemo(() => istanbulDateString(), []);
  const bolgeKey = useMemo(() => filtre.bolge.join("|"), [filtre.bolge]);
  const kategoriKey = useMemo(() => filtre.kategori.join("|"), [filtre.kategori]);
  const ozellikKey = useMemo(() => filtre.ozellikler.join("|"), [filtre.ozellikler]);

  useEffect(() => {
    if (currentArama?.tip === "villa" && currentArama.giris && currentArama.cikis) {
      setGiris(currentArama.giris);
      setCikis(currentArama.cikis);
      const fark = Math.max(
        0,
        Math.ceil((dateFromYmdLocal(currentArama.cikis).getTime() - dateFromYmdLocal(currentArama.giris).getTime()) / 86400000),
      );
      setGeceSayisi(fark);
      return;
    }
    setGiris("");
    setCikis("");
    setGeceSayisi(0);
  }, [currentArama?.cikis, currentArama?.giris, currentArama?.tip]);

  const fetchIlanlar = useCallback(async (aktifFiltre: VillaFiltre) => {
    const supabase = createClient();
    let query = supabase.from("ilanlar").select("*, ilan_medyalari(url,sira,tip)").eq("aktif", true).eq("tip", "villa");

    if (aktifFiltre.bolge.length > 0) {
      const bolgeFiltre = aktifFiltre.bolge
        .map((b) => `konum.ilike.%${b.split(",")[0].trim()}%`)
        .join(",");
      query = query.or(bolgeFiltre);
    }

    query = query
      .gte("gunluk_fiyat", Number(aktifFiltre.minFiyat) || 0)
      .lte("gunluk_fiyat", Number(aktifFiltre.maxFiyat) || 50000);
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

    if (giris && cikis) {
      const { data: doluIlanlar } = await supabase
        .from("musaitlik")
        .select("ilan_id")
        .gte("tarih", giris)
        .lt("tarih", cikis)
        .eq("durum", "dolu");
      const doluIds = doluIlanlar?.map((d) => d.ilan_id) ?? [];
      if (doluIds.length) query = query.not("id", "in", `(${doluIds.join(",")})`);
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
        query = query.order("sponsorlu", { ascending: false }).order("olusturulma_tarihi", { ascending: false });
    }

    const { data, error } = await query;
    if (error) console.error(error);
    setIlanlar(withCoverImage((data ?? []) as ListingRow[]));
    setLoading(false);
  }, [cikis, giris]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchIlanlar(filtre);
    })();
  }, [
    fetchIlanlar,
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
    [filtre],
  );

  const aktifFiltreSayisi = useMemo(() => {
    let count = filtre.bolge.length + filtre.kategori.length + filtre.ozellikler.length;
    if (filtre.minFiyat > 0 || filtre.maxFiyat < 50000) count += 1;
    if (filtre.minKisi > 1) count += 1;
    if (filtre.minYatakOdasi > 1) count += 1;
    return count;
  }, [filtre]);

  const filtreKaldir = useCallback(
    (key: string, value: string) => {
      if (key === "bolge") setFiltre((prev) => ({ ...prev, bolge: prev.bolge.filter((b) => b !== value) }));
      if (key === "kategori") setFiltre((prev) => ({ ...prev, kategori: prev.kategori.filter((k) => k !== value) }));
      if (key === "ozellikler") setFiltre((prev) => ({ ...prev, ozellikler: prev.ozellikler.filter((o) => o !== value) }));
      if (key === "fiyat") setFiltre((prev) => ({ ...prev, minFiyat: defaultFiltre.minFiyat, maxFiyat: defaultFiltre.maxFiyat }));
      if (key === "kisi") setFiltre((prev) => ({ ...prev, minKisi: defaultFiltre.minKisi }));
      if (key === "oda") setFiltre((prev) => ({ ...prev, minYatakOdasi: defaultFiltre.minYatakOdasi }));
    },
    [],
  );

  return (
    <div className="min-h-0 w-full space-y-6 overflow-x-hidden py-6">
      <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[#f0fdfd] px-4 py-3 md:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Tarih ve misafir</p>
        </div>
        <div className="p-4 md:p-5">
          <SearchForm
            bugunIso={bugunIso}
            initialGiris={giris || undefined}
            initialCikis={cikis || undefined}
            initialYetiskin={yetiskin}
            initialCocuk={cocuk}
            initialBebek={bebek}
          />
        </div>
      </section>
      <button
        onClick={() => setMobilFiltre(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#0e9aa7] px-4 py-2.5 text-sm font-semibold text-[#0e9aa7] lg:hidden"
        type="button"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtrele
        {aktifFiltreSayisi > 0 ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0e9aa7] text-xs text-white">
            {aktifFiltreSayisi}
          </span>
        ) : null}
      </button>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="hidden lg:block">
          <VillaFiltreSidebar
            filtre={filtre}
            onChange={setFiltre}
            onTemizle={() => setFiltre(defaultFiltre)}
            sonucSayisi={ilanlar.length}
          />
        </div>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{ilanlar.length}</span> villa listeleniyor
            </p>
            <select
              value={filtre.siralama}
              onChange={(e) => setFiltre({ ...filtre, siralama: e.target.value as VillaFiltre["siralama"] })}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0e9aa7]"
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0e9aa7]/20 bg-[#0e9aa7]/10 px-3 py-1.5 text-xs font-medium text-[#0e9aa7]"
                >
                  {f.label}
                  <button onClick={() => filtreKaldir(f.key, f.value)} type="button">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => setFiltre(defaultFiltre)}
                className="self-center text-xs text-slate-400 underline hover:text-slate-600"
                type="button"
              >
                Tümünü temizle
              </button>
            </div>
          ) : null}

          <p className="rounded-xl border border-slate-200 bg-[#f0fdfd] px-3 py-2 text-sm text-slate-700">
            {loading ? "Villa ilanları yükleniyor..." : `${ilanlar.length} villa bulundu`}
          </p>
          <div className="mt-4 flex w-full flex-col gap-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <SkeletonKart key={i} />
                ))}
              </div>
            ) : (
              ilanlar.map((listing) => (
                <IlanListeKarti
                  key={listing.id}
                  id={listing.id}
                  slug={listing.slug ?? listing.id}
                  baslik={listing.baslik}
                  konum={listing.konum ?? ""}
                  fiyat={listing.gunluk_fiyat}
                  temizlikUcreti={listing.temizlik_ucreti}
                  tip="villa"
                  oda_sayisi={listing.yatak_odasi}
                  banyo_sayisi={listing.banyo}
                  kapasite={listing.kapasite}
                  puan={0}
                  yorum_sayisi={0}
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
              ))
            )}
          </div>
        </main>
      </div>

      {mobilFiltre ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMobilFiltre(false)} type="button" />
          <div className="absolute right-0 top-0 bottom-0 w-80 overflow-y-auto bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Filtreler</h3>
              <button onClick={() => setMobilFiltre(false)} type="button">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <VillaFiltreSidebar
              filtre={filtre}
              onChange={setFiltre}
              onTemizle={() => setFiltre(defaultFiltre)}
              sonucSayisi={ilanlar.length}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
