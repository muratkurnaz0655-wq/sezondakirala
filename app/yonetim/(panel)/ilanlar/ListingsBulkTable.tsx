"use client";

import { useMemo, useState, useTransition } from "react";
import { Home } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/AdminDataTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { formatCurrency } from "@/lib/utils/format";
import { ListingActions } from "./ListingActions";
import { bulkDeactivateListings, bulkDeleteListings } from "./actions";
import { listingCoverImageUrl } from "./listing-cover";

export type ListingTableRow = {
  id: string;
  baslik: string;
  konum: string;
  tip: string;
  sahip_id: string;
  gunluk_fiyat: number;
  aktif: boolean;
  onay_durumu?: "yayinda" | "onay_bekliyor" | "reddedildi" | null;
  slug?: string | null;
  olusturulma_tarihi: string;
  aciklama?: string | null;
  ilan_medyalari?: { id: string; url: string; sira: number }[] | null;
};

export { listingCoverImageUrl } from "./listing-cover";

export function ListingsBulkTable({ listings }: { listings: ListingTableRow[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<"delete" | "deactivate" | null>(null);
  const [isPending, startTransition] = useTransition();
  const allSelected = listings.length > 0 && selectedIds.length === listings.length;
  const selectedCount = selectedIds.length;
  const selectedTitle = useMemo(() => `${selectedCount} ilan seçildi`, [selectedCount]);

  function toggleAll() {
    setSelectedIds(allSelected ? [] : listings.map((listing) => listing.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function runBulkAction() {
    const ids = [...selectedIds];
    startTransition(async () => {
      if (confirmAction === "delete") {
        await bulkDeleteListings(ids);
      } else if (confirmAction === "deactivate") {
        await bulkDeactivateListings(ids);
      }
      setSelectedIds([]);
      setConfirmAction(null);
    });
  }

  return (
    <div className="space-y-3">
      <AdminDataTable minWidthClass="min-w-[1040px]">
        <AdminTableHead>
          <tr>
            <AdminTableHeaderCell>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Tümünü seç" />
            </AdminTableHeaderCell>
            <AdminTableHeaderCell className="w-[64px]">Kapak</AdminTableHeaderCell>
            <AdminTableHeaderCell>İlan</AdminTableHeaderCell>
            <AdminTableHeaderCell>Tip</AdminTableHeaderCell>
            <AdminTableHeaderCell>Fiyat</AdminTableHeaderCell>
            <AdminTableHeaderCell>Durum</AdminTableHeaderCell>
            <AdminTableHeaderCell align="right">İşlemler</AdminTableHeaderCell>
          </tr>
        </AdminTableHead>
        <tbody>
          {listings.map((row) => {
            const url = listingCoverImageUrl(row.ilan_medyalari);
            return (
              <AdminTableRow key={row.id}>
                <AdminTableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleOne(row.id)}
                    aria-label={`${row.baslik} seç`}
                  />
                </AdminTableCell>
                <AdminTableCell className="w-[64px]">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-slate-200">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="h-full w-full object-cover" width={48} height={48} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Home className="h-5 w-5 text-slate-500" aria-hidden />
                      </div>
                    )}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <div>
                    <p className="line-clamp-1 text-sm font-semibold text-slate-800">{row.baslik}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{row.konum}</p>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">
                    {row.tip}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="font-semibold text-slate-800">{formatCurrency(Number(row.gunluk_fiyat ?? 0))}</span>
                  <span className="text-xs text-slate-500"> /gece</span>
                </AdminTableCell>
                <AdminTableCell>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      row.onay_durumu === "yayinda"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : row.onay_durumu === "onay_bekliyor"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : row.onay_durumu === "reddedildi"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {row.onay_durumu === "yayinda"
                      ? "Yayında"
                      : row.onay_durumu === "onay_bekliyor"
                        ? "Onay Bekliyor"
                        : row.onay_durumu === "reddedildi"
                          ? "Reddedildi"
                          : "Taslak"}
                  </span>
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <ListingActions listing={row} />
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </tbody>
      </AdminDataTable>

      {selectedCount > 0 ? (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
          <span className="text-sm font-semibold text-slate-700">{selectedTitle}</span>
          <div className="flex flex-wrap gap-2">
            <AdminActionButton variant="secondary" onClick={() => setConfirmAction("deactivate")} disabled={isPending}>
              Seçilenleri Pasife Al
            </AdminActionButton>
            <AdminActionButton variant="danger" onClick={() => setConfirmAction("delete")} disabled={isPending}>
              Seçilenleri Sil
            </AdminActionButton>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <ConfirmModal
          title={confirmAction === "delete" ? "Seçilen ilanları silmek istediğinize emin misiniz?" : "Seçilen ilanları pasife almak istediğinize emin misiniz?"}
          message={confirmAction === "delete" ? "Bu işlem geri alınamaz. Seçilen ilanlar kalıcı olarak silinecek." : "Seçilen ilanlar yayından kaldırılacak."}
          confirmText={confirmAction === "delete" ? "Evet, Sil" : "Pasife Al"}
          confirmColor={confirmAction === "delete" ? "red" : "amber"}
          pending={isPending}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runBulkAction}
        />
      ) : null}
    </div>
  );
}
