"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Rota değişiminde ana içerik için kısa fade-in (layout `main` içinde). */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade-in flex min-h-0 w-full min-w-0 flex-1 flex-col">
      {children}
    </div>
  );
}
