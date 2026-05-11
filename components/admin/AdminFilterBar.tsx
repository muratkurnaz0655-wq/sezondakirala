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
      className={`rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm ${className}`.trim()}
    >
      {children}
    </form>
  );
}
