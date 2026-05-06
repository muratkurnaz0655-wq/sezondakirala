"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { IlanListeKarti } from "@/components/ilan-liste-karti";
import { SearchForm } from "@/components/search-form";
import { aramaStore } from "@/lib/arama-store";
import { createClient } from "@/lib/supabase/client";
import { dateFromYmdLocal, istanbulDateString } from "@/lib/tr-today";
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

export default function ListingsPage() {
  const currentArama = useSyncExternalStore(aramaStore.subscribe, aramaStore.get, aramaStore.get);
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [loading, setLoading] = useState(true);
  const giris = currentArama?.giris ?? undefined;
  const cikis = currentArama?.cikis ?? undefined;
  const yetiskin = currentArama?.yetiskin ?? 2;
  const cocuk = currentArama?.cocuk ?? 0;
  const bebek = currentArama?.bebek ?? 0;
  const bugunIso = useMemo(() => istanbulDateString(), []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("ilanlar")
        .select("*, ilan_medyalari(url,sira)")
        .eq("aktif", true)
        .eq("tip", "villa");

      if (giris && cikis) {
        const { data: doluIlanlar } = await supabase
          .from("musaitlik")
          .select("ilan_id")
          .gte("tarih", giris)
          .lt("tarih", cikis)
          .eq("durum", "dolu");
        const doluIds = doluIlanlar?.map((d) => d.ilan_id) ?? [];
        if (doluIds.length) {
          query = query.not("id", "in", `(${doluIds.join(",")})`);
        }
      }

      const { data } = await query.order("sponsorlu", { ascending: false });
      setIlanlar(withCoverImage((data ?? []) as ListingRow[]));
      setLoading(false);
    })();
  }, [giris, cikis]);

  const geceSayisi =
    giris && cikis
      ? Math.max(
          0,
          Math.round((dateFromYmdLocal(cikis).getTime() - dateFromYmdLocal(giris).getTime()) / 86400000),
        )
      : 0;

  return (
    <div className="min-h-0 w-full space-y-6 overflow-x-hidden py-6">
      <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[#f0fdfd] px-4 py-3 md:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Tarih ve misafir</p>
        </div>
        <div className="p-4 md:p-5">
          <SearchForm
            bugunIso={bugunIso}
            initialGiris={giris}
            initialCikis={cikis}
            initialYetiskin={yetiskin}
            initialCocuk={cocuk}
            initialBebek={bebek}
          />
        </div>
      </section>
      <div className="flex flex-col gap-6">
        <main className="min-w-0 flex-1">
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
                  tip="villa"
                  oda_sayisi={listing.yatak_odasi}
                  banyo_sayisi={listing.banyo}
                  kapasite={listing.kapasite}
                  puan={0}
                  yorum_sayisi={0}
                  fotograflar={listing.ilk_resim_url ? [listing.ilk_resim_url] : []}
                  one_cikan={listing.sponsorlu}
                  ozellikler={Object.keys(listing.ozellikler ?? {}).filter((key) => listing.ozellikler?.[key])}
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
    </div>
  );
}
