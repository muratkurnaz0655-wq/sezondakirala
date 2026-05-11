"use client";

import Image from "next/image";
import { useState } from "react";

type RegionShowcaseImageProps = {
  src: string;
  alt: string;
  sizes: string;
};

export function RegionShowcaseImage({ src, alt, sizes }: RegionShowcaseImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-200">
      {!loaded ? (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-300"
          aria-hidden
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-[opacity,transform] duration-500 ease-out motion-safe:group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes={sizes}
        onLoadingComplete={() => setLoaded(true)}
      />
    </div>
  );
}
