"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarDays, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deleteListing } from "./actions";
import { EditListingModal } from "./EditListingModal";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { ListingApprovalActions } from "@/components/admin/ListingApprovalActions";

type Listing = {
  id: string;
  slug?: string | null;
  tip: string;
  baslik: string;
  aciklama?: string | null;
  gunluk_fiyat: number;
  konum: string;
  onay_durumu?: "yayinda" | "onay_bekliyor" | "reddedildi" | null;
  ilan_medyalari?: { id: string; url: string; sira: number }[] | null;
};

const iconBtn =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-[0.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function ListingActions({ listing }: { listing: Listing }) {
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ListingApprovalActions
        listingId={listing.id}
        baslik={listing.baslik}
        onayDurumu={listing.onay_durumu}
      />
      <button
        type="button"
        title="Düzenle"
        aria-label="Düzenle"
        onClick={() => setShowEdit(true)}
        className={`${iconBtn} border-[#185FA5]/60 text-[#185FA5] hover:bg-[#185FA5]/12`}
      >
        <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>

      <Link
        href={`/yonetim/ilanlar/${listing.id}/takvim`}
        title="Müsaitlik Takvimi"
        aria-label="Müsaitlik Takvimi"
        className={`${iconBtn} border-[#7C3AED]/55 text-[#7C3AED] hover:bg-[#7C3AED]/10`}
      >
        <CalendarDays className="h-4 w-4" strokeWidth={2} aria-hidden />
      </Link>

      <button
        type="button"
        title="İlana Git"
        aria-label="İlana Git"
        onClick={() =>
          window.open(
            `/${listing.tip === "tekne" ? "tekneler" : "konaklama"}/${listing.slug ?? listing.id}`,
            "_blank",
          )
        }
        className={`${iconBtn} border-[#1D9E75]/55 text-[#1D9E75] hover:bg-[#1D9E75]/12`}
      >
        <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>

      <button
        type="button"
        title="Sil"
        aria-label="Sil"
        disabled={isPending}
        onClick={() => setConfirmDelete(true)}
        className={`${iconBtn} border-[#E24B4A]/55 text-[#E24B4A] hover:bg-[#E24B4A]/10 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>

      {showEdit && <EditListingModal listing={listing} onClose={() => setShowEdit(false)} />}
      {confirmDelete ? (
        <ConfirmModal
          title="İlanı silmek istediğinize emin misiniz?"
          message={
            <>
              Bu işlem geri alınamaz. <strong>{listing.baslik}</strong> kalıcı olarak silinecek.
            </>
          }
          confirmText="Evet, Sil"
          confirmColor="red"
          pending={isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            startTransition(async () => {
              await deleteListing(listing.id);
              setConfirmDelete(false);
            })
          }
        />
      ) : null}
    </div>
  );
}
