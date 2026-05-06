"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type ListingMapProps = {
  label: string;
};

export default function ListingMap({ label }: ListingMapProps) {
  type LooseProps = { children?: React.ReactNode } & Record<string, unknown>;
  const MapContainerAny =
    MapContainer as unknown as React.ComponentType<LooseProps>;
  const TileLayerAny = TileLayer as unknown as React.ComponentType<LooseProps>;
  const MarkerAny = Marker as unknown as React.ComponentType<LooseProps>;

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">{label}</p>
      <MapContainerAny
        center={[36.6219, 29.1164]}
        zoom={13}
        className="h-80 w-full rounded-2xl"
      >
        <TileLayerAny
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerAny position={[36.6219, 29.1164]} />
      </MapContainerAny>
    </div>
  );
}
