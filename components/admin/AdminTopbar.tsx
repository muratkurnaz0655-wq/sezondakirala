"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";

export type AdminKullaniciOzeti = {
  ad_soyad: string | null;
  email: string | null;
  rol: string | null;
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

export function AdminTopbar({ kullanici }: { kullanici: AdminKullaniciOzeti | null }) {
  const pathname = usePathname();
  const baslik = baslikForPath(pathname);
  const harf = kullanici?.ad_soyad?.[0] ?? kullanici?.email?.[0] ?? "A";
  const ad = kullanici?.ad_soyad ?? kullanici?.email ?? "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold text-slate-800" id="admin-page-title">
          {baslik}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex cursor-pointer items-center gap-3">
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
