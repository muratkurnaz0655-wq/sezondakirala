"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Home } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminBadge, type AdminBadgeVariant } from "@/components/admin/AdminBadge";
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

export type ListingOwnerInfo = {
  id: string;
  ad_soyad: string | null;
  email: string | null;
  telefon: string | null;
};

export type ListingTableRow = {
  id: string;
  baslik: string;
  konum: string;
  tip: string;
  sahip_id: string;
  sahip: ListingOwnerInfo | null;
  gunluk_fiyat: number;
  temizlik_ucreti: number;
  kapasite: number;
  yatak_odasi: number;
  banyo: number;
  aktif: boolean;
  onay_durumu?: "yayinda" | "onay_bekliyor" | "reddedildi" | null;
  slug?: string | null;
  olusturulma_tarihi: string;
  aciklama?: string | null;
  ilan_medyalari?: { id: string; url: string; sira: number }[] | null;
};

function formatListingDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ListingOwnerCell({ owner }: { owner: ListingOwnerInfo | null }) {
  if (!owner?.id) {
    return <span className="text-xs text-[#94A3B8]">Sahip bilgisi yok</span>;
  }
  const displayName = owner.ad_soyad?.trim() || owner.email || "İsimsiz kullanıcı";
  return (
    <div className="min-w-[140px] max-w-[220px]">
      <Link
        href={`/yonetim/kullanicilar/${owner.id}`}
        className="text-sm font-semibold text-[#185FA5] hover:underline"
      >
        {displayName}
      </Link>
      {owner.email ? <p className="mt-0.5 text-xs text-[#64748B]">{owner.email}</p> : null}
      {owner.telefon ? <p className="text-xs text-[#64748B]">{owner.telefon}</p> : null}
    </div>
  );
}

export { listingCoverImageUrl } from "./listing-cover";

function onayBadgeVariant(onay: ListingTableRow["onay_durumu"]): AdminBadgeVariant {
  if (onay === "yayinda") return "success";
  if (onay === "onay_bekliyor") return "warning";
  if (onay === "reddedildi") return "danger";
  return "neutral";
}

function onayLabel(onay: ListingTableRow["onay_durumu"]) {
  if (onay === "yayinda") return "Yayında";
  if (onay === "onay_bekliyor") return "Onay Bekliyor";
  if (onay === "reddedildi") return "Reddedildi";
  return "Taslak";
}

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
      <AdminDataTable minWidthClass="min-w-[1280px]">
        <AdminTableHead>
          <tr>
            <AdminTableHeaderCell>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Tümünü seç" />
            </AdminTableHeaderCell>
            <AdminTableHeaderCell className="w-[64px]">Kapak</AdminTableHeaderCell>
            <AdminTableHeaderCell>İlan</AdminTableHeaderCell>
            <AdminTableHeaderCell>İlan sahibi</AdminTableHeaderCell>
            <AdminTableHeaderCell>Tip</AdminTableHeaderCell>
            <AdminTableHeaderCell align="right">Fiyat</AdminTableHeaderCell>
            <AdminTableHeaderCell>Eklenme</AdminTableHeaderCell>
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
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="h-full w-full object-cover" width={44} height={44} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Home className="h-5 w-5 text-[#94A3B8]" aria-hidden />
                      </div>
                    )}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="max-w-[280px]">
                    <p className="line-clamp-1 text-sm font-semibold text-[#1E293B]">{row.baslik}</p>
                    <p className="mt-0.5 text-xs text-[#64748B]">{row.konum}</p>
                    <p className="mt-1 text-[11px] text-[#94A3B8]">
                      {row.kapasite} kişi · {row.yatak_odasi} oda · {row.banyo} banyo
                      {row.temizlik_ucreti > 0 ? ` · Temizlik ${formatCurrency(row.temizlik_ucreti)}` : ""}
                    </p>
                    {row.onay_durumu === "onay_bekliyor" && row.aciklama ? (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#64748B]">{row.aciklama}</p>
                    ) : null}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <ListingOwnerCell owner={row.sahip} />
                </AdminTableCell>
                <AdminTableCell>
                  <span className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-xs font-medium capitalize text-[#64748B]">
                    {row.tip}
                  </span>
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <span className="font-semibold text-[#1E293B]">{formatCurrency(Number(row.gunluk_fiyat ?? 0))}</span>
                  <span className="text-xs text-[#94A3B8]"> /gece</span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-xs text-[#64748B]">{formatListingDate(row.olusturulma_tarihi)}</span>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge variant={onayBadgeVariant(row.onay_durumu)}>{onayLabel(row.onay_durumu)}</AdminBadge>
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
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-xl">
          <span className="text-sm font-semibold text-[#1E293B]">{selectedTitle}</span>
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
