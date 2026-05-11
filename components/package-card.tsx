import Image from "next/image";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import type { Paket } from "@/types/supabase";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";

type PackageCardProps = {
  paket: Paket;
};

const KATEGORI_ETIKET: Record<string, string> = {
  tumu: "Tümü",
  macera: "Macera",
  luks: "Lüks",
  romantik: "Romantik",
  aile: "Aile",
};

/** Lüks → amber, Romantik → pembe, Macera → turuncu, Aile → mavi */
const KATEGORI_RENK: Record<string, string> = {
  macera: "border-orange-200/90 bg-orange-50 text-orange-900",
  luks: "border-amber-200/90 bg-amber-100 text-amber-950",
  romantik: "border-pink-200/90 bg-pink-50 text-pink-900",
  aile: "border-sky-200/90 bg-sky-50 text-sky-900",
};

const PAKET_GORSEL =
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80";

function kategoriLabel(raw: string | null | undefined) {
  if (!raw) return "Paket";
  const key = raw.toLowerCase().trim();
  return KATEGORI_ETIKET[key] ?? fixTurkishDisplay(raw);
}

export function PackageCard({ paket }: PackageCardProps) {
  const baslik = fixTurkishDisplay(paket.baslik);
  const aciklama = fixTurkishDisplay(paket.aciklama ?? "").trim();
  const kat = (paket.kategori ?? "macera").toLowerCase().trim();
  const kapak = paket.gorsel_url ?? PAKET_GORSEL;
  const badgeClass = KATEGORI_RENK[kat] ?? "border-slate-200/90 bg-slate-100 text-slate-800";

  return (
    <div className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/10">
      <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-t-xl">
        <Image
          src={kapak}
          alt={baslik}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur-[2px] ${badgeClass}`}
        >
          {kategoriLabel(paket.kategori)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-medium leading-snug text-slate-900">{baslik}</h3>
        <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-slate-500">
          {aciklama || "Paket detayları için inceleyin."}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} className="text-slate-400" aria-hidden />
            {paket.sure_gun} gün
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" aria-hidden />
            Max {paket.kapasite} kişi
          </span>
        </div>

        <p className="mt-4 text-2xl font-bold text-[#1D9E75]">{formatCurrency(paket.fiyat)}</p>

        <div className="mt-auto pt-4">
          <Link
            href={`/paketler/${paket.slug}`}
            className="flex w-full items-center justify-center rounded-xl border-2 border-[#1D9E75] bg-transparent py-3 text-sm font-semibold text-[#1D9E75] transition-all duration-200 hover:bg-[#1D9E75] hover:text-white"
          >
            İncele
          </Link>
        </div>
      </div>
    </div>
  );
}
