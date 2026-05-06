"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TekneFiltreSidebar } from "@/components/tekne-filtre-sidebar";
import { TekneKarti } from "@/components/tekne-karti";
import { SlidersHorizontal, X } from "lucide-react";
import { defaultTekneFiltre, type TekneFiltre } from "@/lib/villa-sabitleri";

type TekneRow = {
  id: string;
  slug: string | null;
  baslik: string;
  konum: string;
  gunluk_fiyat: number;
  kapasite: number;
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

export default function TeknelerPage() {
  const [tekneler, setTekneler] = useState<TekneRow[]>([]);
  const [filtre, setFiltre] = useState<TekneFiltre>(defaultTekneFiltre);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mobilFiltre, setMobilFiltre] = useState(false);

  const fetchTekneler = async (f: TekneFiltre) => {
    setYukleniyor(true);
    const supabase = createClient();
    let query = supabase
      .from("ilanlar")
      .select("id, slug, baslik, konum, gunluk_fiyat, kapasite, ozellikler, sponsorlu, olusturulma_tarihi, ilan_medyalari(url, sira, tip)")
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <button
        type="button"
        onClick={() => setMobilFiltre(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#0e9aa7] px-4 py-2.5 text-sm font-semibold text-[#0e9aa7] lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtrele
        {aktifFiltreSayisi > 0 ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0e9aa7] text-xs text-white">{aktifFiltreSayisi}</span>
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobilFiltre(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 overflow-y-auto bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Filtreler</h3>
              <button type="button" onClick={() => setMobilFiltre(false)}>
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
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{tekneler.length}</span> tekne listeleniyor
          </p>
          <select
            value={filtre.siralama}
            onChange={(e) => setFiltre({ ...filtre, siralama: e.target.value as TekneFiltre["siralama"] })}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0e9aa7]"
          >
            <option value="onerilen">Önerilen Sıra</option>
            <option value="fiyat_artan">Fiyat: Düşükten Yükseğe</option>
            <option value="fiyat_azalan">Fiyat: Yüksekten Düşüğe</option>
            <option value="kapasite_buyuk">En Büyük Kapasite</option>
          </select>
        </div>

        {yukleniyor ? (
          <div className="grid grid-cols-1 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex animate-pulse overflow-hidden rounded-2xl border border-slate-100">
                <div className="h-48 w-52 flex-shrink-0 bg-slate-200" />
                <div className="flex-1 space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded-full bg-slate-200" />
                  <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!yukleniyor && tekneler.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f0fdfd]">
              <span className="text-4xl">⚓</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-700">Tekne bulunamadı</h3>
            <p className="mb-4 text-sm text-slate-500">Farklı filtre kriterleri deneyin</p>
            <button
              type="button"
              onClick={() => setFiltre(defaultTekneFiltre)}
              className="text-sm font-semibold text-[#0e9aa7] hover:underline"
            >
              Filtreleri temizle
            </button>
          </div>
        ) : null}

        {!yukleniyor && tekneler.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {tekneler.map((tekne) => (
              <TekneKarti key={tekne.id} tekne={tekne} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
