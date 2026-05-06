"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const ListingMap = dynamic(() => import("@/components/listing-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 animate-pulse">
      <MapPin className="h-8 w-8 text-slate-300" />
    </div>
  ),
});

type ListingMapSectionProps = {
  label: string;
};

export function ListingMapSection({ label }: ListingMapSectionProps) {
  return <ListingMap label={label} />;
}
