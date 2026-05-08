"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Clipboard, MessageCircle, X } from "lucide-react";
import { formatWhatsappTrDisplay, whatsappHref } from "@/lib/constants";

type Props = {
  compact?: boolean;
};

function getDiagnosticText(pathname: string) {
  const lines = [
    "Merhaba, Sezondakirala Admin uygulamasında sorun yaşıyorum.",
    "",
    "---- Otomatik Teşhis Bilgileri ----",
    `Zaman: ${new Date().toISOString()}`,
    `Sayfa: ${pathname || "-"}`,
    `Online: ${navigator.onLine ? "evet" : "hayir"}`,
    `Dil: ${navigator.language || "-"}`,
    `Platform: ${navigator.platform || "-"}`,
    `UserAgent: ${navigator.userAgent || "-"}`,
    "----------------------------------",
    "",
    "Sorun detayı:",
  ];
  return lines.join("\n");
}

export function AdminSupportButton({ compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const diagnosticText = useMemo(() => (typeof window !== "undefined" ? getDiagnosticText(pathname) : ""), [pathname]);

  const waLink = useMemo(() => {
    const base = whatsappHref();
    if (!diagnosticText) return base;
    return `${base}?text=${encodeURIComponent(diagnosticText)}`;
  }, [diagnosticText]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(diagnosticText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            : "inline-flex items-center gap-2 rounded-xl border border-[#0e9aa7]/30 bg-[#f0fdfd] px-3 py-2 text-sm font-medium text-[#0e9aa7] hover:bg-[#e6fafa]"
        }
      >
        <AlertCircle className="h-4 w-4" />
        Sorun Bildir
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Destek ve Sorun Bildirimi</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-slate-600">
              Aşağıdaki teşhis bilgilerini bize gönderin. WhatsApp destek hattı:{" "}
              <span className="font-semibold text-slate-800">{formatWhatsappTrDisplay()}</span>
            </p>

            <textarea
              readOnly
              value={diagnosticText}
              className="mb-4 h-56 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 outline-none"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void copyToClipboard()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Clipboard className="h-4 w-4" />
                {copied ? "Kopyalandı" : "Teşhisi Kopyala"}
              </button>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp ile Gönder
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
