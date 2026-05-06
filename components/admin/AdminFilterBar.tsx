import type { ReactNode } from "react";

type AdminFilterBarProps = {
  children: ReactNode;
  method?: "get" | "post";
  className?: string;
};

export function AdminFilterBar({ children, method = "get", className = "" }: AdminFilterBarProps) {
  return (
    <form
      method={method}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`.trim()}
    >
      {children}
    </form>
  );
}
