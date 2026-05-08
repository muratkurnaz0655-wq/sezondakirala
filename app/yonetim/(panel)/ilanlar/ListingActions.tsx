"use client";

import { useTransition, useState } from "react";
import { deleteListing } from "./actions";
import { EditListingModal } from "./EditListingModal";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

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
  const [confirmDelete, setConfirmDelete] = useState(false);
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
        onClick={() => setConfirmDelete(true)}
        variant="danger"
      >
        Sil
      </AdminActionButton>

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
