"use client";

import dynamic from "next/dynamic";

const ListingMap = dynamic(() => import("@/components/listing-map"), {
  ssr: false,
});

type ListingMapSectionProps = {
  label: string;
};

export function ListingMapSection({ label }: ListingMapSectionProps) {
  return <ListingMap label={label} />;
}
