"use client";

import { ClientDayPicker } from "@/components/day-picker-client";
import { dateFromYmdLocal } from "@/lib/tr-today";

type AvailabilityRow = {
  tarih: string;
  durum: "musait" | "dolu" | "ozel_fiyat";
};

type AvailabilityCalendarProps = {
  availability: AvailabilityRow[];
};

export function AvailabilityCalendar({ availability }: AvailabilityCalendarProps) {
  const disabledDays = availability
    .filter((item) => item.durum === "dolu")
    .map((item) => dateFromYmdLocal(item.tarih));

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="mb-2 font-semibold text-slate-900">Müsaitlik Takvimi</h3>
      <ClientDayPicker mode="range" disabled={disabledDays} />
    </div>
  );
}
