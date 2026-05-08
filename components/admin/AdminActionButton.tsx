"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";
type Size = "sm" | "md";

type CommonProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  title?: string;
};

type ButtonProps = CommonProps & {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
};

type LinkProps = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type Props = ButtonProps | LinkProps;

function classesFor(variant: Variant, size: Size) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const bySize =
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const byVariant: Record<Variant, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-red-50 text-red-700 hover:bg-red-100",
    success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return `${base} ${bySize} ${byVariant[variant]}`;
}

export function AdminActionButton({
  children,
  className = "",
  variant = "secondary",
  size = "sm",
  disabled = false,
  title,
  ...rest
}: Props) {
  const classes = `${classesFor(variant, size)} ${className}`.trim();

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={rest.type ?? "button"}
      onClick={rest.onClick}
      disabled={disabled}
      className={classes}
      title={title}
    >
      {children}
    </button>
  );
}
