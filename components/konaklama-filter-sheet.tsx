"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const pageEase = [0.4, 0, 0.2, 1] as const;

type KonaklamaFilterSheetProps = {
  children: ReactNode;
  sheetTitle?: string;
  /** Aktif filtre sayısı — mobil buton rozeti */
  aktifFiltreSayisi?: number;
};

export function KonaklamaFilterSheet({
  children,
  sheetTitle = "Villa filtreleri",
  aktifFiltreSayisi = 0,
}: KonaklamaFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const form = panelRef.current?.querySelector("form");
    if (!form) return;
    const onSubmit = () => setOpen(false);
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <SlidersHorizontal size={18} className="text-white" aria-hidden />
        Filtrele
        {aktifFiltreSayisi > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1 text-xs font-bold text-white">
            {aktifFiltreSayisi}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[70]">
            <motion.button
              key="filter-backdrop"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
            />
            <motion.div
              key="filter-panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="konaklama-filter-sheet-title"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: pageEase }}
              className="absolute inset-x-0 bottom-0 max-h-[min(90dvh,900px)] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                <span id="konaklama-filter-sheet-title" className="font-semibold text-slate-900">
                  {sheetTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Kapat"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">{children}</div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
