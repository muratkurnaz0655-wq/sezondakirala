"use client";

import { useTransition, useState } from "react";
import { deleteListing } from "./actions";
import { EditListingModal } from "./EditListingModal";
import { AdminActionButton } from "@/components/admin/AdminActionButton";

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
    <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
      <AdminActionButton
        title="Bu ilanı düzenle"
        onClick={() => setShowEdit(true)}
        variant="secondary"
      >
        Düzenle
      </AdminActionButton>

      <AdminActionButton
        title="Bu ilanın müsaitlik takvimi"
        href={`/yonetim/ilanlar/${listing.id}/takvim`}
        variant="secondary"
      >
        Müsaitlik Takvimi
      </AdminActionButton>

      <AdminActionButton
        title="İlanı sitede görüntüle"
        onClick={() => window.open(`/${listing.tip === "tekne" ? "tekneler" : "konaklama"}/${listing.slug ?? listing.id}`, "_blank")}
        variant="secondary"
      >
        İlana Git ↗
      </AdminActionButton>

      <AdminActionButton
        title="İlanı sil"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteListing(listing.id);
          })
        }
        variant="danger"
      >
        Sil
      </AdminActionButton>

      {showEdit && <EditListingModal listing={listing} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
