"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar, type AdminKullaniciOzeti } from "@/components/admin/AdminTopbar";

type Props = {
  kullanici: AdminKullaniciOzeti | null;
  children: ReactNode;
};

export function AdminPanelChrome({ kullanici, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-root min-h-screen w-full font-sans text-slate-800">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <AdminSidebar className="fixed left-0 top-0 z-40" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Menüyü kapat"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <AdminSidebar onNavigate={() => setMobileOpen(false)} className="h-full" />
            <button
              type="button"
              aria-label="Menüyü kapat"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg bg-slate-800/80 p-1.5 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="ml-0 min-h-screen bg-slate-50 lg:ml-64">
        <AdminTopbar kullanici={kullanici} onMenuClick={() => setMobileOpen(true)} />
        <main className="admin-main min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-5 pb-12 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
