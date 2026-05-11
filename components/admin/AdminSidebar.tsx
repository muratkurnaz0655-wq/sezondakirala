"use client";

import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
} from "lucide-react";

const menuItems = [
  { href: "/yonetim", label: "Dashboard", icon: LayoutDashboard, exact: true as boolean },
  { href: "/yonetim/ilanlar", label: "İlanlar", icon: Home, exact: false },
  { href: "/yonetim/rezervasyonlar", label: "Rezervasyonlar", icon: Calendar, exact: false },
  { href: "/yonetim/paketler", label: "Paketler", icon: Package, exact: false },
  { href: "/yonetim/kullanicilar", label: "Kullanıcılar", icon: Users, exact: false },
  { href: "/yonetim/ayarlar", label: "Ayarlar", icon: Settings, exact: false },
];

type AdminSidebarProps = {
  onNavigate?: () => void;
  className?: string;
  pendingReservationCount?: number;
};

export function AdminSidebar({ onNavigate, className = "", pendingReservationCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleCikis = async () => {
    await fetch("/api/admin/cikis", { method: "POST" });
    onNavigate?.();
    window.location.href = "/yonetim/giris";
  };

  return (
    <aside className={`flex h-full w-64 flex-col border-r border-slate-800/80 bg-[#0F172A] ${className}`}>
      <div className="border-b border-[#1D9E75]/35 px-6 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-clean.png"
            alt="Sezondakirala"
            width={300}
            height={75}
            priority
            className="h-10 w-auto object-contain"
          />
          <div>
            <p className="mt-0.5 text-xs text-slate-400">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto py-4">
        {menuItems.map(({ href, label, icon: Icon, exact }) => {
          const aktif = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onNavigate?.()}
              className={`mx-2 flex cursor-pointer items-center gap-3 border-l-[3px] py-2.5 pl-[13px] pr-4 text-sm font-medium transition-colors ${
                aktif
                  ? "border-[#1D9E75] bg-white/[0.08] text-white"
                  : "border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{label}</span>
              {label === "Rezervasyonlar" && pendingReservationCount > 0 ? (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {pendingReservationCount > 99 ? "99+" : pendingReservationCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-white/10 p-4">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-slate-200 transition-all hover:bg-white/[0.08] hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Siteyi Görüntüle
        </a>
        <button
          type="button"
          onClick={() => void handleCikis()}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/15 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
