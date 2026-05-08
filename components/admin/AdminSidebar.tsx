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
};

export function AdminSidebar({ onNavigate, className = "" }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleCikis = async () => {
    await fetch("/api/admin/cikis", { method: "POST" });
    onNavigate?.();
    window.location.href = "/yonetim/giris";
  };

  return (
    <aside className={`flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900 ${className}`}>
      <div className="border-b border-slate-800 px-6 py-5">
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
              className={`mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                aktif
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{label}</span>
              {label === "Rezervasyonlar" ? (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  6
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-slate-800 p-4">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          Siteyi Görüntüle
        </a>
        <button
          type="button"
          onClick={() => void handleCikis()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
