"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { aramaStore, rezervasyonStore } from "@/lib/arama-store";

type Props = {
  slug: string;
  ilanTip: "villa" | "tekne";
  giris?: string;
  cikis?: string;
  yetiskin?: number;
  cocuk?: number;
  bebek?: number;
  gunlukFiyat: number;
  className: string;
  children: ReactNode;
};

export function RezervasyonBaslatButton({
  slug,
  ilanTip,
  giris,
  cikis,
  yetiskin = 2,
  cocuk = 0,
  bebek = 0,
  className,
  children,
}: Props) {
  const handleClick = () => {
    const arama = aramaStore.get();
    const selectedGiris = giris ?? arama?.giris ?? new Date().toISOString().slice(0, 10);
    const selectedCikis =
      ilanTip === "villa"
        ? (cikis ?? arama?.cikis ?? new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10))
        : null;
    const selectedGun = ilanTip === "tekne" ? (arama?.gun ?? 1) : null;

    rezervasyonStore.save({
      slug,
      ilanTip,
      giris: selectedGiris,
      cikis: selectedCikis,
      gun: selectedGun,
      yetiskin: arama?.yetiskin ?? yetiskin,
      cocuk: arama?.cocuk ?? cocuk,
      bebek: arama?.bebek ?? bebek,
      adim: 1,
    });
    toast.success("Rezervasyonunuz alındı!");
  };

  return (
    <Link href={`/rezervasyon/${slug}`} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
