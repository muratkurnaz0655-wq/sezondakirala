"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { HeaderProfil } from "@/components/UserDropdown";

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/konaklama", label: "Konaklama" },
  { href: "/tekneler", label: "Tekneler" },
  { href: "/paketler", label: "Paketler" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/sss", label: "SSS" },
] as const;

export type MobileMenuProps = {
  siteName: string;
  variant: "solid" | "hero";
  user: User | null;
  profil: HeaderProfil;
};

export function MobileMenu({ siteName: _siteName, variant, user, profil: _profil }: MobileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const hero = variant === "hero";

  const triggerClass = hero
    ? "border-white/35 bg-white/10 text-white hover:bg-white/15"
    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";

  const kapat = () => setMenuOpen(false);

  const cikis = () => {
    kapat();
    void createClient()
      .auth.signOut()
      .then(() => router.refresh());
  };

  return (
    <div className="shrink-0 md:hidden">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav-dropdown"
        aria-label="Menüyü aç"
        onClick={() => setMenuOpen((prev) => !prev)}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:shadow-md active:scale-[0.98] ${triggerClass}`}
      >
        <Menu size={22} strokeWidth={2} />
      </button>
      {menuOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={kapat}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      ) : null}
      <div
        id="mobile-nav-dropdown"
        className={`${menuOpen ? "flex" : "hidden"} fixed inset-x-0 top-[4.5rem] z-50 max-h-[calc(100dvh-4.5rem)] flex-col gap-1 overflow-y-auto border-b border-slate-100 bg-white p-4 shadow-lg md:hidden`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={kapat}
            className="rounded-xl border-b border-slate-50 px-4 py-3 font-medium text-slate-700 transition-all duration-200 hover:bg-[#f0fdfd] hover:text-[#0e9aa7] hover:shadow-md active:scale-[0.98] last:border-0"
          >
            {link.label}
          </Link>
        ))}
        {user ? (
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            <Link href="/panel" onClick={kapat} className="w-full rounded-xl border border-slate-200 py-2.5 text-center font-medium text-slate-700 transition-all duration-200 hover:shadow-md active:scale-[0.98]">Panel</Link>
            <button type="button" onClick={cikis} className="w-full rounded-xl bg-[#0e9aa7] py-2.5 font-semibold text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">Çıkış Yap</button>
          </div>
        ) : (
          <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3">
            <Link href="/giris" onClick={kapat} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center font-medium text-slate-700 transition-all duration-200 hover:shadow-md active:scale-[0.98]">Giriş Yap</Link>
            <Link href="/kayit" onClick={kapat} className="flex-1 rounded-xl bg-[#0e9aa7] py-2.5 text-center font-semibold text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">Kayıt Ol</Link>
          </div>
        )}
      </div>
    </div>
  );
}
