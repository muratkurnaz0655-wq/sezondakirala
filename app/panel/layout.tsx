import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PanelMobileNav } from "@/components/panel/PanelMobileNav";
import { PanelSidebar } from "@/components/panel/PanelSidebar";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Kullanıcı Paneli",
    description: "Rezervasyon, profil ve mesaj yönetimi.",
    openGraph: { title: "Kullanıcı Paneli", description: "Rezervasyon, profil ve mesaj yönetimi.", images: ["/og-image.jpg"] },
  };
}

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/panel");

  const { data: profil } = await supabase
    .from("kullanicilar")
    .select("rol, ad_soyad, email")
    .eq("id", user.id)
    .maybeSingle();

  const rol = profil?.rol ?? "ziyaretci";

  return (
    <div className="flex w-full flex-col gap-6 overflow-x-hidden lg:flex-row lg:gap-8">
      <PanelSidebar rol={rol} adSoyad={profil?.ad_soyad} email={profil?.email} />
      <main className="min-w-0 flex-1">
        <PanelMobileNav rol={rol} />
        {children}
        <div className="pb-20 lg:pb-0" />
      </main>
    </div>
  );
}
