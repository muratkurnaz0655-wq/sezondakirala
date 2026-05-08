import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminSessionKeeper } from "@/components/admin/admin-session-keeper";
import { hasAdminCookieSession } from "@/lib/admin-session";
import { requireAdminUser } from "@/lib/auth/guards";

const panelKullaniciOzeti = {
  ad_soyad: "Yönetici",
  email: null as string | null,
  rol: "admin" as const,
};

export default async function AdminPanelSegmentLayout({ children }: { children: ReactNode }) {
  if (!(await hasAdminCookieSession())) {
    redirect("/yonetim/giris");
  }

  const admin = await requireAdminUser();
  if (!admin.ok) {
    redirect("/yonetim/giris");
  }

  return (
    <div className="admin-root min-h-screen w-full font-sans text-slate-800">
      <AdminSessionKeeper />
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <AdminSidebar />
      </div>

      <div className="ml-0 min-h-screen bg-slate-50 lg:ml-64">
        <AdminTopbar kullanici={panelKullaniciOzeti} />
        <main className="admin-main min-h-[calc(100vh-64px)] bg-slate-50 px-8 py-6 pb-12">{children}</main>
      </div>
    </div>
  );
}
