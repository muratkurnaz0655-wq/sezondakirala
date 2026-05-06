"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { AdminKullaniciOzeti } from "@/components/admin/AdminTopbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

type AdminShellProps = {
  kullanici: AdminKullaniciOzeti | null;
  children: React.ReactNode;
};

export function AdminShell({ kullanici, children }: AdminShellProps) {
  const [sidebarAcik, setSidebarAcik] = useState(false);

  return (
    <div
      className="admin-layout min-h-screen"
      style={{
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)",
      }}
    >
      <button
        type="button"
        aria-label={sidebarAcik ? "Menüyü kapat" : "Menüyü aç"}
        className="fixed left-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-xl md:hidden"
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
        onClick={() => setSidebarAcik(!sidebarAcik)}
      >
        {sidebarAcik ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
      </button>

      {sidebarAcik ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarAcik(false)}
        />
      ) : null}

      <div
        className={`fixed bottom-0 left-0 top-0 z-50 w-64 transition-transform duration-200 md:translate-x-0 ${
          sidebarAcik ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar onNavigate={() => setSidebarAcik(false)} />
      </div>

      <div className="admin-content min-w-0 md:ml-[260px]">
        <AdminTopbar kullanici={kullanici} />
        <main className="min-h-screen p-4 pt-16 md:p-6 md:pt-6">{children}</main>
      </div>
    </div>
  );
}
