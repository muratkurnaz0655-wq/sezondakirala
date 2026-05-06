"use client";

import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";

export type KonaklamaMapMarker = {
  id: string;
  slug: string;
  baslik: string;
};

function positionFor(id: string): [number, number] {
  const baseLat = 36.6219;
  const baseLng = 29.1164;
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  const dx = ((h % 200) - 100) / 8000;
  const dy = ((((h >> 5) % 200) - 100) / 8000) * 1.2;
  return [baseLat + dx, baseLng + dy];
}

type LooseProps = { children?: React.ReactNode } & Record<string, unknown>;

export function KonaklamaBrowseMap({ markers }: { markers: KonaklamaMapMarker[] }) {
  const MapContainerAny = MapContainer as unknown as React.ComponentType<LooseProps>;
  const TileLayerAny = TileLayer as unknown as React.ComponentType<LooseProps>;
  const MarkerAny = Marker as unknown as React.ComponentType<LooseProps>;
  const PopupAny = Popup as unknown as React.ComponentType<LooseProps>;

  return (
    <MapContainerAny center={[36.6219, 29.1164]} zoom={11} className="h-[min(420px,55vh)] w-full rounded-2xl">
      <TileLayerAny
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <MarkerAny key={m.id} position={positionFor(m.id)}>
          <PopupAny>
            <Link href={`/konaklama/${m.slug}`} className="text-sm font-medium text-sky-700 underline">
              {fixTurkishDisplay(m.baslik)}
            </Link>
          </PopupAny>
        </MarkerAny>
      ))}
    </MapContainerAny>
  );
}
