import type { ReactNode } from "react";

export type AdminBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "neutral"
  | "blue"
  /** Paket kategorileri */
  | "cat_luks"
  | "cat_romantik"
  | "cat_macera"
  | "cat_aile";

const variantClass: Record<AdminBadgeVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  purple: "border-violet-200 bg-violet-50 text-violet-800",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  cat_luks: "border-amber-200 bg-[#FEF3C7] text-[#92400E]",
  cat_romantik: "border-pink-200 bg-[#FCE7F3] text-[#9D174D]",
  cat_macera: "border-orange-200 bg-[#FED7AA] text-[#92400E]",
  cat_aile: "border-sky-200 bg-[#DBEAFE] text-[#1E40AF]",
};

export function AdminBadge({
  children,
  variant,
  className = "",
}: {
  children: ReactNode;
  variant: AdminBadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantClass[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

export function adminPackageCategoryVariant(kategori: string | null | undefined): AdminBadgeVariant {
  const k = (kategori ?? "").toLowerCase().trim();
  if (k === "luks" || k === "lüks") return "cat_luks";
  if (k === "romantik") return "cat_romantik";
  if (k === "macera") return "cat_macera";
  if (k === "aile") return "cat_aile";
  return "neutral";
}
