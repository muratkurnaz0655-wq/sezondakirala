"use client";

import { AlertTriangle } from "lucide-react";

type GlobalErrorProps = {
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-800">Bir şeyler ters gitti</h2>
        <p className="mb-6 text-slate-500">Sayfayı yenilemeyi deneyin</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[#0e9aa7] px-6 py-3 font-semibold text-white transition-all hover:bg-[#0f4c5c]"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
