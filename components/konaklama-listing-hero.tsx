import Link from "next/link";

export type KonaklamaListingHeroProps = {
  ilanSayisi: number;
  giris?: string;
  cikis?: string;
  yetiskin: number;
  cocuk: number;
  bebek: number;
};

export function KonaklamaListingHero({
  ilanSayisi,
  giris,
  cikis,
  yetiskin,
  cocuk,
  bebek,
}: KonaklamaListingHeroProps) {
  const misafirToplam = Math.max(1, yetiskin + cocuk + bebek);
  const misafirLabel =
    cocuk > 0 || bebek > 0
      ? `${yetiskin} yetişkin${cocuk ? `, ${cocuk} çocuk` : ""}${bebek ? `, ${bebek} bebek` : ""}`
      : `${misafirToplam} kişi`;

  return (
    <>
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0284c7 100%)",
          padding: "48px 0 80px",
        }}
      >
        <div
          className="absolute -right-10 -top-10 rounded-full bg-white/10"
          style={{ width: "200px", height: "200px" }}
          aria-hidden
        />
        <div
          className="absolute bottom-[-60px] left-[10%] rounded-full bg-white/[0.08]"
          style={{ width: "150px", height: "150px" }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-sky-200">
            <Link href="/" className="transition-colors hover:text-white">
              Ana Sayfa
            </Link>
            <span>/</span>
            <span className="font-medium text-white">Konaklama</span>
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">Fethiye Villa Kiralama</h1>
          <p className="mb-6 text-lg text-sky-100">
            {ilanSayisi}+ onaylı villa ile hayalinizdeki tatili bulun
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 font-medium text-white/95 backdrop-blur-sm">
              Misafir profili: {misafirLabel}
            </span>
            {giris && cikis ? (
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 font-medium text-white/95 backdrop-blur-sm">
                Seçili tarih: {giris} → {cikis}
              </span>
            ) : null}
            <Link
              href="#liste-alani"
              className="rounded-xl border border-white/25 bg-white/15 px-4 py-1.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              İlanlara geç ↓
            </Link>
          </div>
        </div>
      </div>

      <div className="-mt-px bg-[#f0f9ff]" style={{ lineHeight: 0 }}>
        <svg
          viewBox="0 0 1440 60"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
            fill="#0ea5e9"
            opacity="0.1"
          />
          <path d="M0,40 C480,10 960,60 1440,20 L1440,60 L0,60 Z" fill="#f0f9ff" />
        </svg>
      </div>
    </>
  );
}
