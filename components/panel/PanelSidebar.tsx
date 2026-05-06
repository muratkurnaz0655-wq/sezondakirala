"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  Clock,
  DollarSign,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const tatilciMenusu = [
  { href: "/panel/rezervasyonlar", label: "Rezervasyonlarım", icon: Calendar },
  { href: "/panel/favoriler", label: "Favorilerim", icon: Heart },
  { href: "/panel/mesajlar", label: "Mesajlarım", icon: MessageCircle },
  { href: "/panel/profilim", label: "Profilim", icon: User },
];

const ilanYonetimiLinks = [
  { href: "/panel/ilanlarim", label: "İlanlarım", icon: Home },
  { href: "/panel/talepler", label: "Gelen Talepler", icon: Bell },
  { href: "/panel/takvim", label: "Takvim Yönetimi", icon: Clock },
  { href: "/panel/fiyat", label: "Fiyat Yönetimi", icon: DollarSign },
];

const ilanSahibiHesabimLinks = [
  { href: "/panel/rezervasyonlar", label: "Rezervasyonlarım", icon: Calendar },
  { href: "/panel/favoriler", label: "Favorilerim", icon: Heart },
  { href: "/panel/mesajlar", label: "Mesajlarım", icon: MessageCircle },
  { href: "/panel/profilim", label: "Profilim", icon: User },
];

function linkAktif(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/panel") return false;
  return pathname.startsWith(`${href}/`);
}

function CikisButonu() {
  const router = useRouter();
  const supabase = createClient();

  async function handleCikis() {
    await supabase.auth.signOut();
    router.push("/giris");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleCikis()}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-[#f0fdfd] hover:text-[#0e9aa7] hover:shadow-md active:scale-[0.98]"
    >
      <LogOut size={16} className="text-slate-600" aria-hidden />
      Çıkış Yap
    </button>
  );
}

type PanelSidebarProps = {
  rol: string;
  adSoyad?: string | null;
  email?: string | null;
};

export function PanelSidebar({ rol, adSoyad, email }: PanelSidebarProps) {
  const pathname = usePathname();
  const isHost = rol === "ilan_sahibi" || rol === "admin";

  return (
    <aside className="hidden w-64 shrink-0 rounded-r-2xl border-r border-slate-100 bg-white shadow-sm lg:flex lg:flex-col">
      <div className="mb-2 border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0e9aa7] to-[#06b6d4] text-lg font-bold text-white shadow-md">
            {adSoyad?.trim()?.[0]?.toUpperCase() ?? "K"}
          </div>
          <div className="min-w-0">
            <p className="max-w-[140px] truncate text-sm font-semibold text-slate-800">{adSoyad?.trim() ?? "Kullanıcı"}</p>
            <p className="max-w-[140px] truncate text-xs text-slate-400">{email ?? "kullanici@sezondakirala.com"}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden bg-white p-4">
        {isHost ? (
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">İlan Yönetimi</p>
          </div>
        ) : null}

        <nav className="p-0">
          {isHost ? (
            <>
              {ilanYonetimiLinks.map(({ href, label, icon: Icon }) => {
                const aktif = linkAktif(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                      aktif
                        ? "border-l-2 border-[#0e9aa7] bg-[#0e9aa7]/10 font-semibold text-[#0e9aa7]"
                        : "font-medium text-slate-600 hover:bg-[#f0fdfd] hover:text-[#0e9aa7]"
                    }`}
                  >
                    <Icon size={16} className={aktif ? "text-[#0e9aa7]" : "text-slate-600"} aria-hidden />
                    {label}
                  </Link>
                );
              })}
              <div className="my-2 h-px bg-slate-200" />
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Hesabım</p>
              {ilanSahibiHesabimLinks.map(({ href, label, icon: Icon }) => {
                const aktif = linkAktif(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                      aktif
                        ? "border-l-2 border-[#0e9aa7] bg-[#0e9aa7]/10 font-semibold text-[#0e9aa7]"
                        : "font-medium text-slate-600 hover:bg-[#f0fdfd] hover:text-[#0e9aa7]"
                    }`}
                  >
                    <Icon size={16} className={aktif ? "text-[#0e9aa7]" : "text-slate-600"} aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </>
          ) : (
            tatilciMenusu.map(({ href, label, icon: Icon }) => {
              const aktif = linkAktif(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                    aktif
                      ? "border-l-2 border-[#0e9aa7] bg-[#0e9aa7]/10 font-semibold text-[#0e9aa7]"
                      : "font-medium text-slate-600 hover:bg-[#f0fdfd] hover:text-[#0e9aa7]"
                  }`}
                >
                  <Icon size={16} className={aktif ? "text-[#0e9aa7]" : "text-slate-600"} aria-hidden />
                  {label}
                </Link>
              );
            })
          )}
        </nav>

        <div className="border-t border-slate-200 p-2">
          <CikisButonu />
        </div>
      </div>

      {rol === "ziyaretci" ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-[#f0fdfd] p-4">
          <div className="mb-1 text-sm font-semibold text-slate-800">🏠 Villanız var mı?</div>
          <p className="mb-3 text-xs text-slate-500">İlan sahibi hesabına geçerek villanızı kiraya verin</p>
          <Link
            href="/panel/profilim?yukselt=true"
            className="block rounded-xl bg-gradient-to-r from-[#0e9aa7] to-[#22d3ee] py-2 text-center text-xs font-bold text-[#0d1117] shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            İlan Sahibi Ol
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
