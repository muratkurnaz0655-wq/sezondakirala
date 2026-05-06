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

const KATEGORI_RENK: Record<string, string> = {
  macera: "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700",
  luks: "rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700",
  romantik: "rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700",
  aile: "rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700",
};

const KATEGORI_EMOJI: Record<string, string> = {
  macera: "🧭",
  luks: "✨",
  romantik: "💕",
  aile: "👨‍👩‍👧",
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
  const badgeClass = KATEGORI_RENK[kat] ?? "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600";
  const emoji = KATEGORI_EMOJI[kat] ?? "📦";

  return (
    <div className="group h-full min-h-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#0e9aa7]/15">
      <div className="relative h-48 w-full overflow-hidden sm:h-52">
        <Image
          src={kapak}
          alt={baslik}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className={`absolute left-3 top-3 ${badgeClass}`}>
          {emoji} {kategoriLabel(paket.kategori)}
        </span>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-xl font-semibold leading-tight text-white">{baslik}</h3>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <p className="mb-4 line-clamp-2 text-base leading-relaxed text-slate-500">
          {aciklama || "Paket detayları için inceleyin."}
        </p>
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} aria-hidden />
            {paket.sure_gun} gün
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} aria-hidden />
            Max {paket.kapasite} kişi
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-2xl font-bold text-[#0e9aa7]">{formatCurrency(paket.fiyat)}</span>
            <span className="text-xs text-slate-500"> toplam</span>
          </div>
          <Link href={`/paketler/${paket.slug}`} className="shrink-0 rounded-xl bg-[#0e9aa7] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:bg-[#0f4c5c] active:scale-[0.98]">
            İncele →
          </Link>
        </div>
      </div>
    </div>
  );
}
