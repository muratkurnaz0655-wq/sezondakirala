"use client";

import { useEffect, useMemo, useState } from "react";

type YonetimErrorProps = {
  reset: () => void;
};

type HealthState = "checking" | "ok" | "down";

export default function YonetimError({ reset }: YonetimErrorProps) {
  const [health, setHealth] = useState<HealthState>("checking");
  const errorCode = useMemo(() => {
    const tarih = Date.now().toString(36).toUpperCase();
    const rastgele = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ADM-${tarih}-${rastgele}`;
  }, []);

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

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto mt-12 w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="mt-2 text-xl font-semibold text-amber-900">Yonetim panelinde bir sorun olustu</h2>
      <p className="mt-2 text-sm text-amber-800">
        Beklenmeyen bir hata yakalandi. Lütfen tekrar deneyin veya giris ekranina donun.
      </p>
      <p className="mt-2 text-xs font-mono text-amber-700">Hata Kodu: {errorCode}</p>

      <div className="mt-4 text-xs text-amber-900">
        {health === "checking" && "Sistem durumu kontrol ediliyor..."}
        {health === "ok" && "Health-check: servis yanit veriyor."}
        {health === "down" && "Health-check: servis yaniti alinamadi."}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Tekrar Dene
        </button>
        <a
          href="/yonetim/giris"
          className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Giris Sayfasina Don
        </a>
      </div>
    </div>
  );
}
