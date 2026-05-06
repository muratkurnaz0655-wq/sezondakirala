"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { formatWhatsappTrDisplay, whatsappHref } from "@/lib/constants";

export function GlobalWhatsappWidget() {
  const [open, setOpen] = useState(false);
  const href = whatsappHref();
  const phoneText = formatWhatsappTrDisplay();

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {open ? (
        <div className="mb-3 w-[300px] overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Sezondakirala Destek</p>
              <p className="text-xs text-emerald-50">{phoneText}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-white/20 p-1 transition hover:bg-white/30"
              aria-label="WhatsApp panelini kapat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-3 bg-slate-900 p-3 text-white">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-slate-100">
              Merhaba! Sorularınız için bize yazabilirsiniz. Ekibimiz en kısa sürede dönüş yapar.
            </div>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp'ta Yaz
            </a>
          </div>
        </div>
      ) : null}

      <div className="relative">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl transition hover:scale-105 hover:bg-emerald-600"
            aria-label="WhatsApp destek panelini ac"
          >
            <MessageCircle className="h-7 w-7" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl transition hover:scale-105 hover:bg-emerald-600"
            aria-label="WhatsApp destek panelini kapat"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          1
        </span>
      </div>
    </div>
  );
}
