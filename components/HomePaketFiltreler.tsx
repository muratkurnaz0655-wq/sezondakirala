"use client";

import { useMemo, useState } from "react";
import type { Paket } from "@/types/supabase";
import { PackageCard } from "@/components/package-card";

export type HomePaketKategori = { label: string; value: string };

type HomePaketFiltrelerProps = {
  /** Boş bırakılırsa ana sayfa önizlemesi: sekmesiz, yalnızca `paketler` listelenir. */
  categories?: HomePaketKategori[];
  paketler: Paket[];
};

export function HomePaketFiltreler({ categories = [], paketler }: HomePaketFiltrelerProps) {
  const [aktif, setAktif] = useState("tumu");
  const showTabs = categories.length > 0;

  const gorunen = useMemo(() => {
    if (!showTabs || aktif === "tumu") return paketler;
    return paketler.filter((p) => (p.kategori ?? "").toLowerCase().trim() === aktif);
  }, [aktif, paketler, showTabs]);

  return (
    <>
      {showTabs ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setAktif(category.value)}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                aktif === category.value
                  ? "bg-green-500 text-white shadow-sm"
                  : "border border-slate-200 bg-slate-100 text-slate-700 hover:border-sky-300"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={`grid auto-rows-fr grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3 ${gorunen.length === 1 ? "mx-auto max-w-xl md:grid-cols-1" : ""} ${showTabs ? "mt-4" : "mt-0"}`}
      >
        {gorunen.map((paket) => (
          <PackageCard key={paket.id} paket={paket} />
        ))}
      </div>

      {gorunen.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-500">Bu kategoride henüz paket bulunmuyor.</p>
      ) : null}
    </>
  );
}
