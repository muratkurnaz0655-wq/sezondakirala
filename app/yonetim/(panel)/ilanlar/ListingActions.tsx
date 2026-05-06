"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { deleteListing } from "./actions";
import { EditListingModal } from "./EditListingModal";

type Listing = {
  id: string;
  slug?: string | null;
  tip: string;
  baslik: string;
  aciklama?: string | null;
  gunluk_fiyat: number;
  konum: string;
  ilan_medyalari?: { id: string; url: string; sira: number }[] | null;
};

export function ListingActions({ listing }: { listing: Listing }) {
  const [showEdit, setShowEdit] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-nowrap items-center gap-2">
      <button
        title="Bu ilanı düzenle"
        onClick={() => setShowEdit(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
      >
        Düzenle
      </button>

      <Link
        title="Bu ilanın müsaitlik takvimi"
        href={`/yonetim/ilanlar/${listing.id}/takvim`}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
      >
        Müsaitlik Takvimi
      </Link>

      <button
        title="İlanı sitede görüntüle"
        onClick={() => window.open(`/${listing.tip === "tekne" ? "tekneler" : "konaklama"}/${listing.slug ?? listing.id}`, "_blank")}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.98]"
      >
        İlana Git ↗
      </button>

      <button
        title="İlanı sil"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteListing(listing.id);
          })
        }
        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-100 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sil
      </button>

      {showEdit && <EditListingModal listing={listing} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
