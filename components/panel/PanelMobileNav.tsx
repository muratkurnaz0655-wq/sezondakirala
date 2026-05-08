"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  Clock,
  DollarSign,
  Heart,
  Home,
  MessageCircle,
  User,
} from "lucide-react";

const tatilciHrefs = ["/panel/rezervasyonlar", "/panel/bildirimler", "/panel/favoriler", "/panel/mesajlar", "/panel/profilim"];

const hostExtraHrefs = ["/panel/ilanlarim", "/panel/talepler", "/panel/takvim", "/panel/fiyat"];

function linkAktif(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

const iconMap: Record<string, typeof Calendar> = {
  "/panel/rezervasyonlar": Calendar,
  "/panel/bildirimler": Bell,
  "/panel/favoriler": Heart,
  "/panel/mesajlar": MessageCircle,
  "/panel/profilim": User,
  "/panel/ilanlarim": Home,
  "/panel/talepler": Bell,
  "/panel/takvim": Clock,
  "/panel/fiyat": DollarSign,
};

const labelMap: Record<string, string> = {
  "/panel/rezervasyonlar": "Rezervasyon",
  "/panel/bildirimler": "Bildirim",
  "/panel/favoriler": "Favoriler",
  "/panel/mesajlar": "Mesajlar",
  "/panel/profilim": "Profil",
  "/panel/ilanlarim": "İlanlar",
  "/panel/talepler": "Talepler",
  "/panel/takvim": "Takvim",
  "/panel/fiyat": "Fiyat",
};

type PanelMobileNavProps = { rol: string };

export function PanelMobileNav({ rol }: PanelMobileNavProps) {
  const pathname = usePathname();
  const isHost = rol === "ilan_sahibi" || rol === "admin";
  const hrefs = isHost ? [...hostExtraHrefs, ...tatilciHrefs] : tatilciHrefs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-200 bg-white lg:hidden"
      aria-label="Panel kısayolları"
    >
      {hrefs.slice(0, 5).map((href) => {
        const Icon = iconMap[href] ?? Calendar;
        const aktif = linkAktif(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${
              aktif
                ? "text-[#0e9aa7]"
                : "text-slate-400"
            }`}
          >
            <Icon size={20} aria-hidden />
            <span>{labelMap[href]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
