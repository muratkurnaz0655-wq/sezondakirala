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
};

export function PaketlerCategoryTabs({ activeCategory }: PaketlerCategoryTabsProps) {
  const router = useRouter();

  function setTab(slug: string) {
    if (slug === "tumu") {
      router.replace("/paketler", { scroll: false });
    } else {
      router.replace(`/paketler?kategori=${slug}`, { scroll: false });
    }
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
