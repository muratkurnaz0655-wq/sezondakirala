"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminPackage, updateAdminPackageStatus } from "@/app/actions/admin";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

export function PackageStatusToggle({ id, active, title }: { id: string; active: boolean; title: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={() => setConfirmOpen(true)}
        className={`relative h-7 w-12 rounded-full transition ${active ? "bg-[#1D9E75]" : "bg-[#E2E8F0]"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            active ? "left-6" : "left-1"
          }`}
        />
      </button>
      {confirmOpen ? (
        <ConfirmModal
          title={active ? "Bu paketi pasife almak istediğinize emin misiniz?" : "Bu paketi aktif etmek istediğinize emin misiniz?"}
          message={`${title} paketi ${active ? "pasife alınacak" : "aktif edilecek"}.`}
          confirmText={active ? "Pasife Al" : "Aktif Et"}
          confirmColor={active ? "amber" : "emerald"}
          pending={isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() =>
            startTransition(async () => {
              const formData = new FormData();
              formData.set("id", id);
              formData.set("aktif", active ? "false" : "true");
              await updateAdminPackageStatus(formData);
              setConfirmOpen(false);
            })
          }
        />
      ) : null}
    </>
  );
}

const iconDangerClass =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-[0.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-[#E24B4A]/55 text-[#E24B4A] hover:bg-[#E24B4A]/10 disabled:cursor-not-allowed disabled:opacity-50";

export function PackageDeleteButton({ id, title, iconOnly = false }: { id: string; title: string; iconOnly?: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          title="Sil"
          aria-label="Sil"
          disabled={isPending}
          onClick={() => setConfirmOpen(true)}
          className={iconDangerClass}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <AdminActionButton type="button" variant="danger" onClick={() => setConfirmOpen(true)} disabled={isPending}>
          Sil
        </AdminActionButton>
      )}
      {confirmOpen ? (
        <ConfirmModal
          title="Paketi silmek istediğinize emin misiniz?"
          message={
            <>
              Bu işlem geri alınamaz. <strong>{title}</strong> kalıcı olarak silinecek.
            </>
          }
          confirmText="Evet, Sil"
          confirmColor="red"
          pending={isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() =>
            startTransition(async () => {
              const formData = new FormData();
              formData.set("id", id);
              await deleteAdminPackage(formData);
              setConfirmOpen(false);
            })
          }
        />
      ) : null}
    </>
  );
}
