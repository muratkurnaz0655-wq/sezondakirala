"use client";

import { useState, useTransition } from "react";
import { updateReservationStatus } from "./actions";

export function ReservationStatusSelect({
  reservationId,
  initialStatus,
}: {
  reservationId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newStatus: string) => {
    const prevStatus = status;
    setStatus(newStatus);
    setError(null);
    startTransition(async () => {
      const result = await updateReservationStatus(
        reservationId,
        newStatus,
      );
      if (result.success) {
        setStatus(result.status);
      } else {
        setStatus(prevStatus);
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-1">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className={`cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all duration-200 hover:shadow-md active:scale-[0.98] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isPending ? "opacity-60" : ""
        }`}
      >
        <option value="beklemede">Beklemede</option>
        <option value="onaylandi">Onaylandi</option>
        <option value="iptal">Iptal</option>
      </select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
