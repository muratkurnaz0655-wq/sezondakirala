"use client";

import dynamic from "next/dynamic";
import type { DayPickerProps } from "react-day-picker";
import "react-day-picker/dist/style.css";

export const ClientDayPicker = dynamic<DayPickerProps>(
  () => import("react-day-picker").then((m) => m.DayPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Takvim yükleniyor…
      </div>
    ),
  },
);
