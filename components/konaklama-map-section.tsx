"use client";

import dynamic from "next/dynamic";
import type { KonaklamaMapMarker } from "@/components/konaklama-browse-map";

const KonaklamaBrowseMap = dynamic(
  () => import("@/components/konaklama-browse-map").then((m) => ({ default: m.KonaklamaBrowseMap })),
  {
  ssr: false,
    loading: () => (
      <div className="flex h-[min(420px,55vh)] w-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
        Harita yükleniyor…
      </div>
    ),
  },
);

export function KonaklamaMapSection({ markers }: { markers: KonaklamaMapMarker[] }) {
  return <KonaklamaBrowseMap markers={markers} />;
}
