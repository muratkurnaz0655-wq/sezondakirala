"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { AdminSupportButton } from "@/components/admin/AdminSupportButton";
import { useState } from "react";
import { markAllNotificationsRead } from "@/app/actions/admin";

export type AdminKullaniciOzeti = {
  ad_soyad: string | null;
  email: string | null;
  rol: string | null;
};

export type AdminNotification = {
  id: string;
  label: string;
  href: string;
  tone: "info" | "warning" | "danger";
};

const sayfaBasliklari: Record<string, string> = {
  "/yonetim": "Dashboard",
  "/yonetim/ilanlar": "İlan Yönetimi",
  "/yonetim/rezervasyonlar": "Rezervasyonlar",
  "/yonetim/paketler": "Paket Yönetimi",
  "/yonetim/kullanicilar": "Kullanıcılar",
  "/yonetim/ayarlar": "Ayarlar",
};

function baslikForPath(pathname: string): string {
  if (sayfaBasliklari[pathname]) return sayfaBasliklari[pathname];
  if (pathname.startsWith("/yonetim/ilanlar/")) return "İlan takvimi";
  return "Yönetim";
}

export function AdminTopbar({
  kullanici,
  onMenuClick,
  notifications = [],
  unreadCount = 0,
}: {
  kullanici: AdminKullaniciOzeti | null;
  onMenuClick?: () => void;
  notifications?: AdminNotification[];
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const baslik = baslikForPath(pathname);
  const harf = kullanici?.ad_soyad?.[0] ?? kullanici?.email?.[0] ?? "A";
  const ad = kullanici?.ad_soyad ?? kullanici?.email ?? "Admin";
  const unread = notifications.filter((item) => !readIds.includes(item.id));
  const unreadBadgeCount = Math.max(unread.length, unreadCount);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center">
        <button
          type="button"
          aria-label="Menüyü aç"
          onClick={onMenuClick}
          className="mr-3 inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-lg font-semibold text-slate-800 sm:text-xl" id="admin-page-title">
          {baslik}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <AdminSupportButton compact />
        <div className="relative">
          <button
            type="button"
            aria-label="Bildirimler"
            onClick={() => setOpen((value) => !value)}
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
            {unreadBadgeCount ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" /> : null}
          </button>
          {open ? (
            <div className="absolute right-0 top-11 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Bildirimler</p>
                <button
                  type="button"
                  onClick={async () => {
                    setReadIds(notifications.map((item) => item.id));
                    await markAllNotificationsRead();
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Tümünü okundu işaretle
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {notifications.length ? (
                  notifications.map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => setReadIds((ids) => [...new Set([...ids, item.id])])}
                      className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${
                          item.tone === "danger" ? "bg-red-500" : item.tone === "warning" ? "bg-amber-500" : "bg-sky-500"
                        }`}
                      />
                      {item.label}
                    </a>
                  ))
                ) : (
                  <p className="px-3 py-5 text-center text-sm text-slate-500">Yeni bildirim yok</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden cursor-pointer items-center gap-3 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
            {harf}
          </div>
          <span className="text-sm font-medium text-slate-700">{ad}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
