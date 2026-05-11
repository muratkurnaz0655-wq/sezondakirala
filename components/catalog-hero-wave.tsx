"use client";

type CatalogHeroWaveProps = {
  /** Üstteki hero ile birleşecek alt dolgu rengi (ör. sayfa arka planı) */
  fillBottom?: string;
  className?: string;
};

/** Alt kenarda yavaş kaydırılan dalga — hero ile liste arası geçiş */
export function CatalogHeroWave({ fillBottom = "#ffffff", className = "" }: CatalogHeroWaveProps) {
  return (
    <div className={`relative -mb-px h-10 w-full overflow-hidden md:h-12 ${className}`} aria-hidden>
      <div className="catalog-hero-wave-inner absolute inset-x-0 bottom-0 h-full">
        <svg className="h-full w-full text-white/30" viewBox="0 0 1440 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M0,26 C240,6 480,42 720,24 C960,6 1200,40 1440,22 L1440,48 L0,48 Z" />
          <path fill={fillBottom} d="M0,34 C320,14 560,46 840,28 C980,18 1140,40 1440,26 L1440,48 L0,48 Z" />
        </svg>
      </div>
    </div>
  );
}
