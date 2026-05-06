import Link from "next/link";

export type TeknelerListingHeroProps = {
  ilanSayisi: number;
};

export function TeknelerListingHero({ ilanSayisi }: TeknelerListingHeroProps) {
  return (
    <>
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 45%, #0ea5e9 100%)",
          padding: "48px 0 80px",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-teal-100">
            <Link href="/" className="transition-colors hover:text-white">
              Ana Sayfa
            </Link>
            <span className="text-teal-200/90">/</span>
            <span className="font-medium text-white">Tekneler</span>
          </div>

          <p className="mb-2 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/95 backdrop-blur-sm">
            Ölüdeniz · Göcek · Fethiye limanı
          </p>
          <h1 className="mb-3 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Fethiye tekne kiralama
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-teal-50 md:text-xl">
            Gulet, motoryat ve günlük turlar — kapasite, tarih ve bütçenize göre filtreleyin;{" "}
            <span className="font-semibold text-white">{ilanSayisi}+</span> ilanı tek ekranda
            karşılaştırın.
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-medium text-white backdrop-blur-sm">
              Günlük / haftalık kiralama
            </span>
            <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-medium text-white backdrop-blur-sm">
              Mürettebatlı seçenekler
            </span>
            <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-medium text-white backdrop-blur-sm">
              TURSAB güvencesi
            </span>
          </div>
        </div>
      </div>

      <div className="-mt-px bg-gradient-to-b from-emerald-50 to-white" style={{ lineHeight: 0 }}>
        <svg
          viewBox="0 0 1440 56"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full text-teal-500/15"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0,28 C360,56 1080,0 1440,28 L1440,56 L0,56 Z" fill="currentColor" />
          <path d="M0,36 C480,8 960,52 1440,24 L1440,56 L0,56 Z" fill="#ecfdf5" />
        </svg>
      </div>
    </>
  );
}
