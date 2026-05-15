"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { BOLGELER, KATEGORILER, OZELLIKLER } from "@/lib/villa-sabitleri";
import { VILLA_PRICE_FILTER_DEFAULT_MAX, type VillaFiltre } from "@/types/filtre";

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
  const maxFiyatLimit = toplamModu ? 200_000 : VILLA_PRICE_FILTER_DEFAULT_MAX;
  const fiyatStep = toplamModu ? 1000 : 500;

  const minSliderMax = Math.max(fiyatStep, filtre.maxFiyat - fiyatStep);
  const maxSliderMin = Math.min(maxFiyatLimit - fiyatStep, filtre.minFiyat + fiyatStep);

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

        <FiltreSection title="Bölge">
          <div className="space-y-2">
            {BOLGELER.map((bolge) => (
              <label
                key={bolge}
                className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-[#1D9E75]/30 hover:bg-emerald-50/40"
              >
                <input
                  type="checkbox"
                  checked={filtre.bolge.includes(bolge)}
                  onChange={(e) => {
                    const yeni = e.target.checked ? [...filtre.bolge, bolge] : filtre.bolge.filter((b) => b !== bolge);
                    onChange({ ...filtre, bolge: yeni });
                  }}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300"
                  style={{ accentColor: ACCENT }}
                />
                <span className="text-sm font-medium text-slate-700">{bolge}</span>
              </label>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title={toplamModu ? `Toplam Fiyat (${geceSayisi} gece)` : "Gecelik Fiyat"}>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-slate-500">
                <span>Min</span>
                <span>₺{filtre.minFiyat.toLocaleString("tr-TR")}</span>
              </div>
              <input
                type="range"
                min={0}
                max={minSliderMax}
                step={fiyatStep}
                value={Math.min(filtre.minFiyat, minSliderMax)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onChange({ ...filtre, minFiyat: Math.min(v, filtre.maxFiyat - fiyatStep) });
                }}
                className="h-2 w-full cursor-pointer rounded-full bg-slate-100 accent-[#1D9E75]"
                aria-label="Minimum fiyat"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-500">
                <span>Max</span>
                <span>₺{filtre.maxFiyat.toLocaleString("tr-TR")}</span>
              </div>
              <input
                type="range"
                min={maxSliderMin}
                max={maxFiyatLimit}
                step={fiyatStep}
                value={Math.max(filtre.maxFiyat, maxSliderMin)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onChange({ ...filtre, maxFiyat: Math.max(v, filtre.minFiyat + fiyatStep) });
                }}
                className="h-2 w-full cursor-pointer rounded-full bg-slate-100 accent-[#1D9E75]"
                aria-label="Maksimum fiyat"
              />
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
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    filtre.minFiyat === r.min && filtre.maxFiyat === r.max
                      ? "border-transparent text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-[#1D9E75]/40"
                  }`}
                  style={
                    filtre.minFiyat === r.min && filtre.maxFiyat === r.max ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined
                  }
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
                className={`h-10 min-w-[2.5rem] rounded-xl border px-2 text-sm font-semibold transition-all ${
                  filtre.minKisi === n ? "border-transparent text-white shadow-md" : "border-slate-200 text-slate-600 hover:border-[#1D9E75]/50"
                }`}
                style={filtre.minKisi === n ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined}
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
                className={`h-10 min-w-[2.5rem] rounded-xl border px-2 text-sm font-semibold transition-all ${
                  filtre.minYatakOdasi === n ? "border-transparent text-white shadow-md" : "border-slate-200 text-slate-600 hover:border-[#1D9E75]/50"
                }`}
                style={filtre.minYatakOdasi === n ? { backgroundColor: ACCENT, borderColor: ACCENT } : undefined}
              >
                {n}+
              </button>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Tatil Türü">
          <div className="space-y-2">
            {KATEGORILER.map((kat) => (
              <label
                key={kat.value}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 transition-colors hover:border-[#1D9E75]/30 hover:bg-emerald-50/40"
              >
                <input
                  type="checkbox"
                  checked={filtre.kategori.includes(kat.value)}
                  onChange={(e) => {
                    const yeni = e.target.checked ? [...filtre.kategori, kat.value] : filtre.kategori.filter((k) => k !== kat.value);
                    onChange({ ...filtre, kategori: yeni });
                  }}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded"
                  style={{ accentColor: ACCENT }}
                />
                <span className="text-sm font-medium text-slate-700">{kat.label}</span>
              </label>
            ))}
          </div>
        </FiltreSection>

        <FiltreSection title="Özellikler">
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {OZELLIKLER.map((oz) => (
              <label
                key={oz.value}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 transition-colors hover:border-[#1D9E75]/30 hover:bg-emerald-50/40"
              >
                <input
                  type="checkbox"
                  checked={filtre.ozellikler.includes(oz.value)}
                  onChange={(e) => {
                    const yeni = e.target.checked ? [...filtre.ozellikler, oz.value] : filtre.ozellikler.filter((o) => o !== oz.value);
                    onChange({ ...filtre, ozellikler: yeni });
                  }}
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
