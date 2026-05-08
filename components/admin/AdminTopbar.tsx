"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CalendarDays, ChevronDown, Home, Menu, UserPlus, XCircle } from "lucide-react";
import { AdminSupportButton } from "@/components/admin/AdminSupportButton";
import { useState } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/admin";

export type AdminKullaniciOzeti = {
  ad_soyad: string | null;
  email: string | null;
  rol: string | null;
};

export type AdminNotification = {
  id: string;
  tip: string | null;
  baslik: string | null;
  mesaj: string | null;
  olusturulma_tarihi: string;
  entity_tip: string | null;
  entity_id: string | null;
  okundu: boolean;
  href: string;
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const baslik = baslikForPath(pathname);
  const harf = kullanici?.ad_soyad?.[0] ?? kullanici?.email?.[0] ?? "A";
  const ad = kullanici?.ad_soyad ?? kullanici?.email ?? "Admin";
  const unread = notifications.filter((item) => !item.okundu && !readIds.includes(item.id));
  const unreadBadgeCount = Math.max(unread.length, unreadCount);

  const formatDate = (value: string) => {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const notificationTitle = (item: AdminNotification) => {
    if (item.tip === "yeni_rezervasyon") return "Yeni rezervasyon";
    if (item.tip === "iptal_rezervasyon") return "Rezervasyon iptal edildi";
    if (item.tip === "yeni_kullanici") return "Yeni kullanıcı kaydı";
    if (item.tip === "yeni_ilan") return "Yeni ilan eklendi";
    return item.baslik ?? "Bildirim";
  };

  const notificationIcon = (item: AdminNotification) => {
    if (item.tip === "yeni_rezervasyon") {
      return { wrapper: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300", Icon: CalendarDays };
    }
    if (item.tip === "yeni_kullanici") {
      return { wrapper: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", Icon: UserPlus };
    }
    if (item.tip === "iptal_rezervasyon") {
      return { wrapper: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300", Icon: XCircle };
    }
    return { wrapper: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", Icon: Home };
  };

  const isUnread = (item: AdminNotification) => !item.okundu && !readIds.includes(item.id);

  const openNotification = async (item: AdminNotification) => {
    if (isUnread(item)) {
      setReadIds((ids) => [...new Set([...ids, item.id])]);
      await markNotificationRead(item.id);
    }
    setOpen(false);
    router.push(item.href);
  };

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
            <div
              className="absolute right-0 top-11 w-[340px] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700/70 dark:bg-slate-900"
              style={{ borderWidth: "0.5px" }}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bildirimler</p>
                  {unreadBadgeCount > 0 ? (
                    <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                      {unreadBadgeCount > 99 ? "99+" : unreadBadgeCount}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={!unreadBadgeCount || markingAll}
                  onClick={async () => {
                    setMarkingAll(true);
                    setReadIds(notifications.map((item) => item.id));
                    await markAllNotificationsRead();
                    setMarkingAll(false);
                  }}
                  className="text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Tümünü okundu yap
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {notifications.length ? (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void openNotification(item)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isUnread(item)
                          ? "bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      {(() => {
                        const { wrapper, Icon } = notificationIcon(item);
                        return (
                          <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${wrapper}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                        );
                      })()}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-slate-800 dark:text-slate-100">
                          {notificationTitle(item)}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.mesaj ?? "-"}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
                          {formatDate(item.olusturulma_tarihi)}
                        </span>
                      </span>
                      <span className="w-3 pt-1">
                        {isUnread(item) ? <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" /> : null}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-5 text-center text-sm text-slate-500">Yeni bildirim yok</p>
                )}
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5 text-center dark:border-slate-800">
                <Link
                  href="/yonetim/bildirimler"
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setOpen(false)}
                >
                  Tüm bildirimleri gör -&gt;
                </Link>
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
