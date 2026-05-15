"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DateRange } from "react-day-picker";
import { tr } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import { ClientDayPicker } from "@/components/day-picker-client";
import { formatTurkishDateRange } from "@/lib/format-turkish-date";
import { PANEL_DAY_PICKER_CLASS } from "@/components/panel/panel-day-picker-styles";

type PanelDateRangeFieldProps = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  label?: string;
  placeholder?: string;
  id?: string;
};

export function PanelDateRangeField({
  value,
  onChange,
  label = "Tarih aralığı",
  placeholder = "Başlangıç ve bitiş seçin",
  id = "panel-date-range",
}: PanelDateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [monthCount, setMonthCount] = useState(2);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function sync() {
      setMonthCount(window.innerWidth < 768 ? 1 : 2);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const displayText =
    value?.from != null
      ? formatTurkishDateRange(value.from, value.to ?? value.from)
      : placeholder;

  const pickerPanel = (
    <div className={`${PANEL_DAY_PICKER_CLASS} flex justify-center`}>
      <ClientDayPicker
        mode="range"
        locale={tr}
        numberOfMonths={monthCount}
        selected={value}
        onSelect={onChange}
        defaultMonth={value?.from}
      />
    </div>
  );

  return (
    <div className="relative">
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {label}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[42px] w-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-left text-sm font-medium text-slate-900 transition hover:border-sky-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
        <span className={value?.from ? "truncate text-slate-900" : "truncate text-slate-400"}>
          {displayText}
        </span>
        {value?.from ? (
          <span
            role="button"
            tabIndex={0}
            className="ml-auto shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange(undefined);
              }
            }}
            aria-label="Tarih aralığını temizle"
          >
            <X className="h-4 w-4" />
          </span>
        ) : null}
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100000] flex bg-slate-900/40 p-4 sm:items-center sm:justify-center"
              role="presentation"
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <div
                ref={popoverRef}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                className="mx-auto flex w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl max-sm:mt-auto max-sm:max-h-[92dvh] max-sm:rounded-b-none"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Kapat
                  </button>
                </div>
                <div className="overflow-y-auto p-4 sm:p-5">{pickerPanel}</div>
                <div className="border-t border-slate-100 p-4 sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={!value?.from}
                    className="w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Tamam
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
