"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { BOLGELER, KATEGORILER, OZELLIKLER } from "@/lib/villa-sabitleri";
import type { VillaFiltre } from "@/types/filtre";

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

export function VillaFiltreSidebar({
  filtre,
  onChange,
  onTemizle,
  sonucSayisi,
  geceSayisi = 0,
}: {
  filtre: VillaFiltre;
  onChange: (filtre: VillaFiltre) => void;
  onTemizle: () => void;
  sonucSayisi: number;
  geceSayisi?: number;
}) {
  const toplamModu = geceSayisi > 1;
  const maxFiyatLimit = toplamModu ? 200000 : 20000;
  const fiyatStep = toplamModu ? 1000 : 500;

  return (
    <aside className="w-full shrink-0 lg:w-72">
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
        <FiltreSection title="Bölge">
          <div className="space-y-2">
            {BOLGELER.map((bolge) => (
              <label key={bolge} className="group flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filtre.bolge.includes(bolge)}
                  onChange={(e) => {
                    const yeni = e.target.checked ? [...filtre.bolge, bolge] : filtre.bolge.filter((b) => b !== bolge);
                    onChange({ ...filtre, bolge: yeni });
                  }}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#0e9aa7] text-[#0e9aa7]"
                />
                <span className="text-sm text-slate-600 transition-colors group-hover:text-slate-900">{bolge}</span>
              </label>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title={toplamModu ? `Toplam Fiyat (${geceSayisi} gece)` : "Gecelik Fiyat"}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-400">Min ₺</label>
                <input
                  type="number"
                  value={filtre.minFiyat}
                  min={0}
                  max={filtre.maxFiyat}
                  step={fiyatStep}
                  onChange={(e) => onChange({ ...filtre, minFiyat: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0e9aa7] focus:ring-1 focus:ring-[#0e9aa7]/20"
                />
              </div>
              <span className="mt-4 text-slate-300">-</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-slate-400">Max ₺</label>
                <input
                  type="number"
                  value={filtre.maxFiyat}
                  min={filtre.minFiyat}
                  max={maxFiyatLimit}
                  step={fiyatStep}
                  onChange={(e) => onChange({ ...filtre, maxFiyat: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#0e9aa7] focus:ring-1 focus:ring-[#0e9aa7]/20"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "₺0-2K", min: 0, max: 2000 },
                { label: "₺2K-5K", min: 2000, max: 5000 },
                { label: "₺5K-10K", min: 5000, max: 10000 },
                { label: "₺10K+", min: 10000, max: 50000 },
              ].map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => onChange({ ...filtre, minFiyat: r.min, maxFiyat: r.max })}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-all ${
                    filtre.minFiyat === r.min && filtre.maxFiyat === r.max
                      ? "border-[#0e9aa7] bg-[#0e9aa7] text-white"
                      : "border-slate-200 text-slate-600 hover:border-[#0e9aa7]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </FiltreSection>

        <FiltreSection title="Kişi Sayısı">
          <div className="flex flex-wrap gap-2">
            {[2, 4, 6, 8, 10, 12, 15, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...filtre, minKisi: n })}
                className={`h-10 w-10 rounded-xl border text-sm font-medium transition-all ${
                  filtre.minKisi === n
                    ? "border-[#0e9aa7] bg-[#0e9aa7] text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-[#0e9aa7]"
                }`}
              >
                {n}+
              </button>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Yatak Odası">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...filtre, minYatakOdasi: n })}
                className={`h-10 w-10 rounded-xl border text-sm font-medium transition-all ${
                  filtre.minYatakOdasi === n
                    ? "border-[#0e9aa7] bg-[#0e9aa7] text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-[#0e9aa7]"
                }`}
              >
                {n}+
              </button>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Tatil Türü">
          <div className="space-y-2">
            {KATEGORILER.map((kat) => (
              <label key={kat.value} className="group flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filtre.kategori.includes(kat.value)}
                  onChange={(e) => {
                    const yeni = e.target.checked
                      ? [...filtre.kategori, kat.value]
                      : filtre.kategori.filter((k) => k !== kat.value);
                    onChange({ ...filtre, kategori: yeni });
                  }}
                  className="h-4 w-4 cursor-pointer rounded accent-[#0e9aa7]"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900">{kat.label}</span>
              </label>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Özellikler">
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {OZELLIKLER.map((oz) => (
              <label key={oz.value} className="group flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filtre.ozellikler.includes(oz.value)}
                  onChange={(e) => {
                    const yeni = e.target.checked
                      ? [...filtre.ozellikler, oz.value]
                      : filtre.ozellikler.filter((o) => o !== oz.value);
                    onChange({ ...filtre, ozellikler: yeni });
                  }}
                  className="h-4 w-4 cursor-pointer rounded accent-[#0e9aa7]"
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
