"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";

const MAP_SRC =
  "https://www.google.com/maps?q=Fethiye,+Mu%C4%9Fla,+T%C3%BCrkiye&output=embed";

export function ContactMapEmbed() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] shadow-sm">
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#F1F5F9] px-4 text-center transition-opacity duration-500 ${
          loaded ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={loaded}
      >
        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
        <MapPin className="h-8 w-8 text-[#1D9E75]/70" aria-hidden />
        <p className="text-sm font-medium text-slate-600">Harita yükleniyor…</p>
      </div>
      <iframe
        title="Fethiye harita"
        src={MAP_SRC}
        width="100%"
        height="280"
        className={`block w-full transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-40"}`}
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
