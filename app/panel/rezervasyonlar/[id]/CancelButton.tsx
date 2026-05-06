"use client";

import { useState } from "react";
import { cancelReservation } from "./actions";

export function CancelButton({ reservationId }: { reservationId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="mt-3 w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
      >
        Rezervasyonu İptal Et
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="mb-3 text-sm font-medium text-red-700">
        Bu rezervasyonu iptal etmek istediğinizden emin misiniz?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirm(false)}
          className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 transition-all hover:bg-slate-50"
        >
          Vazgeç
        </button>
        <button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await cancelReservation(reservationId);
          }}
          className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "İptal ediliyor..." : "Evet, İptal Et"}
        </button>
      </div>
    </div>
  );
}
