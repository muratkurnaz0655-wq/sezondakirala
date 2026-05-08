"use client";

import type { ReactNode } from "react";

type ConfirmColor = "red" | "amber" | "blue" | "emerald" | "slate";

type ConfirmModalProps = {
  title: string;
  message: ReactNode;
  confirmText: string;
  confirmColor?: ConfirmColor;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
};

const confirmClasses: Record<ConfirmColor, string> = {
  red: "bg-red-600 text-white hover:bg-red-700",
  amber: "bg-amber-500 text-white hover:bg-amber-600",
  blue: "bg-blue-600 text-white hover:bg-blue-700",
  emerald: "bg-emerald-600 text-white hover:bg-emerald-700",
  slate: "bg-slate-700 text-white hover:bg-slate-800",
};

export function ConfirmModal({
  title,
  message,
  confirmText,
  confirmColor = "red",
  onConfirm,
  onCancel,
  pending = false,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="confirm-modal-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
        </div>
        <div className="px-5 py-4 text-sm leading-6 text-slate-600">{message}</div>
        <div className="flex justify-end gap-2 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${confirmClasses[confirmColor]}`}
          >
            {pending ? "İşleniyor..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
