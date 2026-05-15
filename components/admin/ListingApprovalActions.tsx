"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { approveListing, rejectListing } from "@/app/yonetim/(panel)/ilanlar/actions";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

const iconBtn =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-[0.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function ListingApprovalActions({
  listingId,
  baslik,
  onayDurumu,
}: {
  listingId: string;
  baslik: string;
  onayDurumu?: "yayinda" | "onay_bekliyor" | "reddedildi" | null;
}) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (onayDurumu !== "onay_bekliyor") return null;

  return (
    <>
      <button
        type="button"
        title="Onayla"
        aria-label="Onayla"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await approveListing(listingId);
            if (result.success) router.refresh();
          })
        }
        className={`${iconBtn} border-emerald-500/55 text-emerald-600 hover:bg-emerald-50`}
      >
        <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        title="Reddet"
        aria-label="Reddet"
        disabled={isPending}
        onClick={() => setRejectOpen(true)}
        className={`${iconBtn} border-amber-500/55 text-amber-700 hover:bg-amber-50`}
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      {rejectOpen ? (
        <ConfirmModal
          title="İlanı reddetmek istiyor musunuz?"
          message={
            <RejectListingForm baslik={baslik} reason={rejectReason} onReasonChange={setRejectReason} />
          }
          confirmText="Reddet"
          confirmColor="red"
          pending={isPending}
          onCancel={() => {
            setRejectOpen(false);
            setRejectReason("");
          }}
          onConfirm={() =>
            startTransition(async () => {
              const result = await rejectListing(listingId, rejectReason);
              if (result.success) {
                setRejectOpen(false);
                setRejectReason("");
                router.refresh();
              }
            })
          }
        />
      ) : null}
    </>
  );
}

function RejectListingForm({
  baslik,
  reason,
  onReasonChange,
}: {
  baslik: string;
  reason: string;
  onReasonChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3 text-left text-sm text-slate-600">
      <p>
        <strong className="text-slate-800">{baslik}</strong> ilanı reddedilecek ve sitede yayınlanmayacak.
      </p>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Red nedeni (isteğe bağlı)</span>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
          placeholder="İlan sahibine iletilecek kısa açıklama"
        />
      </label>
    </div>
  );
}
