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

const ACCENT = "#1D9E75";

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
    <div className="mb-5 border-b border-slate-100 pb-5 last:mb-0 last:border-0 last:pb-0">
      <button onClick={() => setOpen(!open)} className="mb-3 flex w-full items-center justify-between rounded-lg py-0.5" type="button">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</span>
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
    <aside className="w-full shrink-0 lg:w-72 lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md ring-1 ring-slate-100/80">
        <div className="mb-5 flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
            <span className="truncate font-semibold text-slate-900">Filtreler</span>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: ACCENT }}
            >
              {sonucSayisi}
            </span>
          </div>
          <button onClick={onTemizle} className="shrink-0 text-xs font-medium hover:underline" style={{ color: ACCENT }} type="button">
            Temizle
          </button>
        </div>

        <FiltreSection title="Kalkış Limanı">
          <div className="space-y-2">
            {TEKNE_LIMANLARI.map((liman) => (
              <label
                key={liman}
                className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-[#1D9E75]/30 hover:bg-emerald-50/40"
              >
                <input
                  type="checkbox"
                  checked={filtre.liman.includes(liman)}
                  onChange={(e) =>
                    onChange({
                      ...filtre,
                      liman: e.target.checked ? [...filtre.liman, liman] : filtre.liman.filter((l) => l !== liman),
                    })
                  }
                  className="h-4 w-4 shrink-0 cursor-pointer rounded"
                  style={{ accentColor: ACCENT }}
                />
                <span className="text-sm font-medium text-slate-700">{liman}</span>
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
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                  filtre.tekne_tipi.includes(tip.value) ? "border-transparent text-white shadow-md" : "border-slate-200 text-slate-600 hover:border-[#1D9E75]/50"
                }`}
                style={
                  filtre.tekne_tipi.includes(tip.value) ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined
                }
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
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                  filtre.sure.includes(sure.value) ? "border-transparent text-white shadow-md" : "border-slate-200 text-slate-600 hover:border-[#1D9E75]/50"
                }`}
                style={filtre.sure.includes(sure.value) ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined}
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
                <label className="mb-1 block text-xs font-medium text-slate-500">Min ₺</label>
                <input
                  type="number"
                  value={filtre.minFiyat}
                  min={0}
                  step={500}
                  onChange={(e) => onChange({ ...filtre, minFiyat: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]/20"
                />
              </div>
              <span className="mt-4 text-slate-300">—</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-500">Max ₺</label>
                <input
                  type="number"
                  value={filtre.maxFiyat}
                  max={50000}
                  step={500}
                  onChange={(e) => onChange({ ...filtre, maxFiyat: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]/20"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(500, filtre.maxFiyat)}
              step={500}
              value={filtre.minFiyat}
              onChange={(e) => onChange({ ...filtre, minFiyat: Math.min(Number(e.target.value), filtre.maxFiyat - 500) })}
              className="h-2 w-full cursor-pointer rounded-full bg-slate-100 accent-[#1D9E75]"
              aria-label="Minimum günlük fiyat"
            />
          </div>
        </FiltreSection>

        <FiltreSection title="Kişi Kapasitesi">
          <div className="flex flex-wrap gap-2">
            {[2, 4, 6, 8, 10, 12, 15].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...filtre, minKapasite: n })}
                className={`h-10 min-w-[2.5rem] rounded-xl border px-2 text-sm font-semibold transition-all ${
                  filtre.minKapasite === n ? "border-transparent text-white shadow-md" : "border-slate-200 text-slate-600 hover:border-[#1D9E75]/50"
                }`}
                style={filtre.minKapasite === n ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined}
              >
                {n}+
              </button>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Özellikler">
          <div className="space-y-2">
            {TEKNE_OZELLIKLERI.map((oz) => (
              <label
                key={oz.value}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 transition-colors hover:border-[#1D9E75]/30 hover:bg-emerald-50/40"
              >
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
                  className="h-4 w-4 shrink-0 cursor-pointer rounded"
                  style={{ accentColor: ACCENT }}
                />
                <span className="text-sm font-medium text-slate-700">{oz.label}</span>
              </label>
            ))}
          </div>
        </FiltreSection>
      </div>
    </aside>
  );
}
