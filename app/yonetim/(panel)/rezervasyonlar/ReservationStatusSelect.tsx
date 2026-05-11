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
        title="Rezervasyon durumunu güncelle"
        className={`min-w-[8.5rem] cursor-pointer rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-sm text-[#1E293B] transition-all focus:border-[#185FA5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 ${
          isPending ? "opacity-60" : ""
        }`}
      >
        <option value="pending">Beklemede</option>
        <option value="approved">Onaylandı</option>
        <option value="cancelled">İptal</option>
      </select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
