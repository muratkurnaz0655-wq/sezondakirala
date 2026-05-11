"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Sayfa içeriği mount’ta hafif fade-in + translateY */
export function AdminPageMountFade({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
  }, []);
  return (
    <div
      className={`space-y-6 transition-all duration-[250ms] ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
