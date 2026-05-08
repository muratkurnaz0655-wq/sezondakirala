"use client";

import { useState, useTransition } from "react";
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
        className={`relative h-7 w-12 rounded-full transition ${active ? "bg-emerald-500" : "bg-slate-300"}`}
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

export function PackageDeleteButton({ id, title }: { id: string; title: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <AdminActionButton type="button" variant="danger" onClick={() => setConfirmOpen(true)} disabled={isPending}>
        Sil
      </AdminActionButton>
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
