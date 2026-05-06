"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { IlanListeKarti } from "@/components/ilan-liste-karti";
import { SearchForm } from "@/components/search-form";
import { aramaStore } from "@/lib/arama-store";
import { createClient } from "@/lib/supabase/client";
import { istanbulDateString } from "@/lib/tr-today";
import type { Ilan } from "@/types/supabase";

type ListingRow = Ilan & { ilan_medyalari?: Array<{ url: string; sira: number }> | null };

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

export default function BoatsPage() {
  const currentArama = useSyncExternalStore(aramaStore.subscribe, aramaStore.get, aramaStore.get);
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [loading, setLoading] = useState(true);
  const baslangic = currentArama?.giris ?? undefined;
  const kacGun = Math.max(1, currentArama?.gun ?? 1);
  const kisi = currentArama?.yetiskin ?? 2;
  const bugunIso = useMemo(() => istanbulDateString(), []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("ilanlar")
        .select("*, ilan_medyalari(url,sira)")
        .eq("aktif", true)
        .eq("tip", "tekne");
      if (baslangic) {
        const bitisDate = new Date(baslangic);
        bitisDate.setDate(bitisDate.getDate() + kacGun);
        const bitis = bitisDate.toISOString().slice(0, 10);
        const { data: doluIlanlar } = await supabase
          .from("musaitlik")
          .select("ilan_id")
          .gte("tarih", baslangic)
          .lt("tarih", bitis)
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
  }, [baslangic, kacGun]);

  return (
    <div className="min-w-0 w-full space-y-6 overflow-x-hidden py-6">
      <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[#f0fdfd] px-4 py-3 md:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Tekne araması</p>
        </div>
        <div className="p-4 md:p-5">
          <SearchForm
            key={`${baslangic ?? "empty"}-${kacGun}-${kisi}`}
            bugunIso={bugunIso}
            searchPath="/tekneler"
            submitLabel="Tekne Bul"
            initialGiris={baslangic}
            initialYetiskin={kisi}
            initialGun={kacGun}
          />
        </div>
      </section>
      <div className="flex flex-col gap-6">
        <main className="min-w-0 flex-1">
          <p className="rounded-xl border border-slate-200 bg-[#f0fdfd] px-3 py-2 text-sm text-slate-700">
            {loading ? "Tekne ilanları yükleniyor..." : `${ilanlar.length} tekne bulundu`}
          </p>
          <div className="mt-4 flex w-full flex-col gap-4">
            {ilanlar.map((listing) => (
              <IlanListeKarti
                key={listing.id}
                id={listing.id}
                slug={listing.slug ?? listing.id}
                baslik={listing.baslik}
                konum={listing.konum ?? ""}
                fiyat={listing.gunluk_fiyat}
                tip="tekne"
                oda_sayisi={listing.yatak_odasi}
                banyo_sayisi={listing.banyo}
                kapasite={listing.kapasite}
                puan={0}
                yorum_sayisi={0}
                fotograflar={listing.ilk_resim_url ? [listing.ilk_resim_url] : []}
                one_cikan={listing.sponsorlu}
                ozellikler={Object.keys(listing.ozellikler ?? {}).filter((key) => listing.ozellikler?.[key])}
                geceSayisi={kacGun}
                giris={baslangic}
                yetiskin={kisi}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
