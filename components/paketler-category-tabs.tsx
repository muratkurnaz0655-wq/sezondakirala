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
    <div className="flex flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setTab(tab)}
          className={`mr-2 mt-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
            activeCategory === tab ? "bg-green-500 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:border-sky-300"
          } ${activeCategory === tab ? "" : "border border-slate-200"}`}
        >
          {LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
