"use client";

import { useMemo } from "react";

type GlobalErrorProps = {
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  const hataKodu = useMemo(() => {
    const tarih = Date.now().toString(36).toUpperCase();
    const rastgele = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ERR-${tarih}-${rastgele}`;
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl overflow-x-hidden rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6 text-center">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-lg sm:text-xl font-semibold text-red-800">Bir hata oluştu</h2>
      <p className="mt-2 text-sm text-red-700">
        Beklenmeyen bir sorunla karşılaştık. Lütfen sayfayı yenileyin.
      </p>
      <p className="mt-2 text-xs font-mono text-red-600">Hata Kodu: {hataKodu}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
