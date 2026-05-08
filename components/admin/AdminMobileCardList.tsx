import type { ReactNode } from "react";

export function AdminMobileCardList({ children }: { children: ReactNode }) {
  return <div className="block space-y-3 lg:hidden">{children}</div>;
}

export function AdminMobileCard({ children }: { children: ReactNode }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4">{children}</article>;
}
