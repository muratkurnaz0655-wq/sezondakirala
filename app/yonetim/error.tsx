"use client";

import { useEffect, useMemo, useState } from "react";

type YonetimErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

type HealthState = "checking" | "ok" | "down";

function formatCause(cause: unknown, depth = 0): string {
  if (depth > 4) return "(…)";
  if (cause == null) return "";
  if (cause instanceof Error) {
    const inner = cause.cause != null ? `\n  cause: ${formatCause(cause.cause, depth + 1)}` : "";
    return `${cause.name}: ${cause.message}${inner}`;
  }
  try {
    return JSON.stringify(cause);
  } catch {
    return String(cause);
  }
}

export default function YonetimError({ error, reset }: YonetimErrorProps) {
  const [health, setHealth] = useState<HealthState>("checking");
  const [isDev] = useState(() => process.env.NODE_ENV === "development");

  const errorCode = useMemo(() => {
    const tarih = Date.now().toString(36).toUpperCase();
    const rastgele = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ADM-${tarih}-${rastgele}`;
  }, []);

  const digest = error.digest ?? "";
  const technicalLines = [
    `Hata adı: ${error.name || "Error"}`,
    `Mesaj: ${error.message || "(mesaj yok — üretimde Next.js ayrıntıyı gizleyebilir)"}`,
    digest ? `Next.js digest: ${digest}` : "Next.js digest: (yok — geliştirme modunda veya istemci hatasında olabilir)",
    error.cause != null ? `Cause:\n${formatCause(error.cause)}` : "",
    isDev && error.stack ? `\n--- Stack (yalnızca development) ---\n${error.stack}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  useEffect(() => {
    console.error("[yonetim/error]", error.name, error.message, digest || "", error);
  }, [error, digest]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!cancelled) {
          setHealth(res.ok ? "ok" : "down");
        }
      } catch {
        if (!cancelled) {
          setHealth("down");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl px-4 pb-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <div className="text-4xl">⚠️</div>
        <h2 className="mt-2 text-xl font-semibold text-amber-900">Yönetim panelinde bir sorun oluştu</h2>
        <p className="mt-2 text-sm text-amber-800">
          Beklenmeyen bir hata yakalandı. Aşağıdaki teknik metin, hatanın nereden geldiğini anlamanız
          içindir. Üretimde mesaj kısaltılmış olabilir; tam ayrıntı için sunucu / Vercel loglarına bakın.
        </p>
        <p className="mt-2 text-xs font-mono text-amber-800">Referans: {errorCode}</p>

        <div className="mt-4 text-xs text-amber-900">
          {health === "checking" && "Sistem durumu kontrol ediliyor…"}
          {health === "ok" && "Health-check: servis yanıt veriyor (uygulama ayakta; hata büyük olasılıkla bu sayfa render’ında)."}
          {health === "down" && "Health-check: servis yanıtı alınamadı."}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Tekrar dene
          </button>
          <a
            href="/yonetim/giris"
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Giriş sayfasına dön
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-300 bg-slate-900 p-4 text-left shadow-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Yakalanan hata (kopyalayıp paylaşabilirsiniz)
        </h3>
        <pre className="mt-2 max-h-[min(420px,55vh)] overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-emerald-100">
          {technicalLines}
        </pre>
        {digest ? (
          <p className="mt-3 text-[11px] text-slate-500">
            Vercel / hosting loglarında aynı <span className="font-mono text-slate-400">{digest}</span> digest
            değerini arayın.
          </p>
        ) : null}
      </div>
    </div>
  );
}
