"use client";

import { useRouter } from "next/navigation";

const TABS = ["tumu", "macera", "luks", "romantik", "aile"] as const;

const LABELS: Record<(typeof TABS)[number], string> = {
  tumu: "Tümü",
  macera: "Macera",
  luks: "Lüks",
  romantik: "Romantik",
  aile: "Aile",
};

type PaketlerCategoryTabsProps = {
  activeCategory: string;
  giris?: string;
  cikis?: string;
};

export function PaketlerCategoryTabs({ activeCategory, giris, cikis }: PaketlerCategoryTabsProps) {
  const router = useRouter();

  function setTab(slug: string) {
    const params = new URLSearchParams();
    if (slug !== "tumu") params.set("kategori", slug);
    if (giris) params.set("giris", giris);
    if (cikis) params.set("cikis", cikis);
    const query = params.toString();
    if (!query) {
      router.replace("/paketler", { scroll: false });
      return;
    }
    router.replace(`/paketler?${query}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {TABS.map((tab) => {
        const active = activeCategory === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => setTab(tab)}
            className={`rounded-full border px-5 py-2.5 text-base font-medium transition-all duration-300 motion-safe:hover:scale-[1.02] ${
              active
                ? "border-transparent bg-[#1D9E75] text-white shadow-md shadow-[#1D9E75]/25"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#1D9E75]/35 hover:bg-[#E1F5EE]"
            }`}
          >
            {LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}
