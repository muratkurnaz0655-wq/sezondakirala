import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type PageListingHeroProps = {
  breadcrumbCurrent: string;
  title: string;
  subtitle: string;
};

export function PageListingHero({ breadcrumbCurrent, title, subtitle }: PageListingHeroProps) {
  return (
    <div className="overflow-x-hidden border-b border-slate-200 bg-gradient-to-r from-[#0e9aa7] to-[#06b6d4]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 md:px-6 md:py-16">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-white/60">
          <Link href="/" className="transition-colors hover:text-white/90">
            Ana Sayfa
          </Link>
          <ChevronRight size={12} className="shrink-0 text-white/50" aria-hidden />
          <span className="text-white/90">{breadcrumbCurrent}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-base text-white/80 sm:text-lg">{subtitle}</p>
      </div>
    </div>
  );
}
