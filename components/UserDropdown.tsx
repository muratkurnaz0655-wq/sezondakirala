"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Calendar,
  ChevronDown,
  Heart,
  Home,
  LogOut,
  Shield,
  User as UserIcon,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type HeaderProfil = { ad_soyad: string; rol: string } | null;

type UserDropdownProps = {
  user: User;
  profil: HeaderProfil;
  /** Üst şerit açık (beyaz) / hero (koyu) — tetikleyici stili */
  variant: "solid" | "hero";
};

export function UserDropdown({ user, profil, variant }: UserDropdownProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const adSoyad = profil?.ad_soyad ?? user.email?.split("@")[0] ?? "Kullanıcı";
  const bas = adSoyad.trim()[0]?.toUpperCase() ?? "?";

  const triggerSolid =
    "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:bg-slate-50";
  const triggerHero =
    "flex items-center gap-2 rounded-full border border-white/30 bg-white/10 pl-2 pr-4 py-1.5 text-white transition-colors hover:bg-white/20";

  async function handleCikis() {
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  useEffect(() => {
    const onDocPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={variant === "solid" ? triggerSolid : triggerHero}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
          {bas}
        </div>
        <span
          className={`hidden text-sm font-medium md:block ${
            variant === "solid" ? "text-slate-700" : "text-white/95"
          }`}
        >
          {adSoyad.split(" ")[0]}
        </span>
        <ChevronDown size={14} className={variant === "solid" ? "text-slate-500" : "text-white/80"} />
      </button>

      <div
        className={`absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white py-2 shadow-xl transition-all ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
        role="menu"
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="text-sm font-semibold text-gray-900">{adSoyad}</div>
          <div className="mt-0.5 text-xs text-gray-400">{user.email}</div>
        </div>

        {profil?.rol === "admin" ? (
          <Link
            href="/yonetim"
            onClick={closeMenu}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-600 hover:bg-gray-50"
            role="menuitem"
          >
            <Shield size={14} aria-hidden />
            Yönetim Paneli
          </Link>
        ) : null}

        {profil?.rol === "ilan_sahibi" ? (
          <>
            <Link
              href="/panel/ilanlarim"
              onClick={closeMenu}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
            >
              <Home size={14} aria-hidden />
              İlanlarım
            </Link>
            <Link
              href="/panel/talepler"
              onClick={closeMenu}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              role="menuitem"
            >
              <Bell size={14} aria-hidden />
              Gelen Talepler
            </Link>
          </>
        ) : null}

        <Link
          href="/panel/rezervasyonlar"
          onClick={closeMenu}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          role="menuitem"
        >
          <Calendar size={14} aria-hidden />
          Rezervasyonlarım
        </Link>
        <Link
          href="/panel/favoriler"
          onClick={closeMenu}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          role="menuitem"
        >
          <Heart size={14} aria-hidden />
          Favorilerim
        </Link>
        <Link
          href="/panel/profilim"
          onClick={closeMenu}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          role="menuitem"
        >
          <UserIcon size={14} aria-hidden />
          Profil Ayarları
        </Link>

        <div className="mt-2 border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={() => void handleCikis()}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
            role="menuitem"
          >
            <LogOut size={14} aria-hidden />
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
