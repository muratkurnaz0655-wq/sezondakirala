"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import {
  TEKNE_LIMANLARI,
  TEKNE_OZELLIKLERI,
  TEKNE_SURE_SECENEKLERI,
  TEKNE_TIPLERI,
  type TekneFiltre,
} from "@/lib/villa-sabitleri";

function FiltreSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-5 border-b border-slate-100 pb-5 last:border-0">
      <button onClick={() => setOpen(!open)} className="mb-3 flex w-full items-center justify-between" type="button">
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-700">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open ? children : null}
    </div>
  );
}

type Props = {
  filtre: TekneFiltre;
  onChange: (filtre: TekneFiltre) => void;
  onTemizle: () => void;
  sonucSayisi: number;
};

export function TekneFiltreSidebar({ filtre, onChange, onTemizle, sonucSayisi }: Props) {
  return (
    <aside className="w-full flex-shrink-0 lg:w-72">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#0e9aa7]" />
          <span className="font-bold text-slate-800">Filtreler</span>
          <span className="text-xs text-slate-400">({sonucSayisi} sonuç)</span>
        </div>
        <button onClick={onTemizle} className="text-xs font-medium text-[#0e9aa7] hover:underline" type="button">
          Temizle
        </button>
      </div>

      <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <FiltreSection title="Kalkış Limanı">
          <div className="space-y-2">
            {TEKNE_LIMANLARI.map((liman) => (
              <label key={liman} className="group flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filtre.liman.includes(liman)}
                  onChange={(e) =>
                    onChange({
                      ...filtre,
                      liman: e.target.checked ? [...filtre.liman, liman] : filtre.liman.filter((l) => l !== liman),
                    })
                  }
                  className="h-4 w-4 rounded accent-[#0e9aa7]"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900">{liman}</span>
              </label>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Tekne Tipi">
          <div className="flex flex-wrap gap-2">
            {TEKNE_TIPLERI.map((tip) => (
              <button
                key={tip.value}
                type="button"
                onClick={() => {
                  const yeni = filtre.tekne_tipi.includes(tip.value)
                    ? filtre.tekne_tipi.filter((v) => v !== tip.value)
                    : [...filtre.tekne_tipi, tip.value];
                  onChange({ ...filtre, tekne_tipi: yeni });
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  filtre.tekne_tipi.includes(tip.value)
                    ? "border-[#0e9aa7] bg-[#0e9aa7] text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-[#0e9aa7]"
                }`}
              >
                {tip.label}
              </button>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Kiralama Süresi">
          <div className="flex flex-wrap gap-2">
            {TEKNE_SURE_SECENEKLERI.map((sure) => (
              <button
                key={sure.value}
                type="button"
                onClick={() => {
                  const yeni = filtre.sure.includes(sure.value)
                    ? filtre.sure.filter((s) => s !== sure.value)
                    : [...filtre.sure, sure.value];
                  onChange({ ...filtre, sure: yeni });
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                  filtre.sure.includes(sure.value)
                    ? "border-[#0e9aa7] bg-[#0e9aa7] text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-[#0e9aa7]"
                }`}
              >
                {sure.label}
              </button>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Günlük Fiyat">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-400">Min ₺</label>
                <input
                  type="number"
                  value={filtre.minFiyat}
                  min={0}
                  step={500}
                  onChange={(e) => onChange({ ...filtre, minFiyat: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0e9aa7]"
                />
              </div>
              <span className="mt-4 text-slate-300">—</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-400">Max ₺</label>
                <input
                  type="number"
                  value={filtre.maxFiyat}
                  max={50000}
                  step={500}
                  onChange={(e) => onChange({ ...filtre, maxFiyat: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0e9aa7]"
                />
              </div>
            </div>
          </div>
        </FiltreSection>

        <FiltreSection title="Kişi Kapasitesi">
          <div className="flex flex-wrap gap-2">
            {[2, 4, 6, 8, 10, 12, 15].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...filtre, minKapasite: n })}
                className={`h-10 w-10 rounded-xl border text-sm font-medium transition-all ${
                  filtre.minKapasite === n
                    ? "border-[#0e9aa7] bg-[#0e9aa7] text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-[#0e9aa7]"
                }`}
              >
                {n}+
              </button>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Özellikler">
          <div className="space-y-2">
            {TEKNE_OZELLIKLERI.map((oz) => (
              <label key={oz.value} className="group flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filtre.ozellikler.includes(oz.value)}
                  onChange={(e) =>
                    onChange({
                      ...filtre,
                      ozellikler: e.target.checked
                        ? [...filtre.ozellikler, oz.value]
                        : filtre.ozellikler.filter((o) => o !== oz.value),
                    })
                  }
                  className="h-4 w-4 rounded accent-[#0e9aa7]"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900">{oz.label}</span>
              </label>
            ))}
          </div>
        </FiltreSection>
      </div>
    </aside>
  );
}
