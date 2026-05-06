"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { deleteListing } from "@/app/actions/owner";

type OwnerListingDeleteDialogProps = {
  listingId: string;
  listingTitle: string;
};

export function OwnerListingDeleteDialog({ listingId, listingTitle }: OwnerListingDeleteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setConfirmed(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleDelete() {
    if (!confirmed || isDeleting) return;
    const fd = new FormData();
    fd.set("listing_id", listingId);
    setIsDeleting(true);
    try {
      await deleteListing(fd);
      setOpen(false);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex flex-1 min-w-[8.5rem] items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Sil
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                Bu ilanı gerçekten silmek istiyor musunuz?
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Pencereyi kapat"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div id={descId} className="mt-4 space-y-4 text-sm text-slate-700">
              <p>
                İlanınızı silmeden önce lütfen <strong>temsilcimiz</strong> ile iletişime geçin (
                <Link
                  href="/iletisim"
                  className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                >
                  İletişim sayfası
                </Link>
                ). Rezervasyon, ödeme veya sözleşme kapsamındaki yükümlülükleriniz açısından silme işlemi
                öncesinde bilgilendirme almanız önemlidir.
              </p>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                <p className="font-semibold text-amber-900">Dikkat</p>
                <p className="mt-2 leading-relaxed">
                  Temsilci ile iletişime geçilmeden yapılan silmelerde anlaşmazlık, iptal veya iade süreçlerinde
                  aksaklıklar yaşanabilir. Onaylanmış veya devam eden talepler varsa bunlar etkilenebilir.
                </p>
                <p className="mt-2 font-medium text-amber-950">
                  Kurallara aykırı veya temsilci onayı olmadan yapılan silimlerde bu platformda{" "}
                  <strong>yeniden ilan verme hakkınız kısıtlanabilir veya tamamen kapatılabilir</strong>.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium leading-snug text-slate-800">
                  Temsilci ile iletişime geçtim; yine de bu ilanı kalıcı olarak silmek istiyorum.
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!confirmed || isDeleting}
                onClick={handleDelete}
                className="rounded-xl border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
              >
                {isDeleting ? "Siliniyor…" : "İlanı kalıcı olarak sil"}
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-500 line-clamp-2" title={listingTitle}>
              {listingTitle}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
