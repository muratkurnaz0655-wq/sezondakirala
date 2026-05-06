import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminGirisForm } from "@/components/admin/AdminGirisForm";
import { hasAdminCookieSession } from "@/lib/admin-session";
import { requireAdminUser } from "@/lib/auth/guards";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Admin Girişi",
    description: `${SITE_NAME} yönetim paneli girişi.`,
  };
}

export default async function AdminGirisPage() {
  const hasCookieSession = await hasAdminCookieSession();
  if (hasCookieSession) {
    const admin = await requireAdminUser();
    if (admin.ok) {
      redirect("/yonetim");
    }
  }

  const admin = await requireAdminUser();
  if (admin.ok) {
    redirect("/yonetim");
  }

  return (
    <div
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-48 -top-48 h-96 w-96 rounded-full"
          style={{ background: "#0ea5e9", opacity: 0.08, filter: "blur(100px)" }}
        />
        <div
          className="absolute -bottom-48 -right-48 h-96 w-96 rounded-full"
          style={{ background: "#22c55e", opacity: 0.06, filter: "blur(120px)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 mx-4 sm:mx-6 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-3">
            <Image
              src="/logo-clean.png"
              alt="Sezondakirala"
              width={300}
              height={75}
              priority
              className="mx-auto h-14 w-auto object-contain"
            />
          </div>
          <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400">Yönetim paneline erişmek için giriş yapın</p>
        </div>

        <div
          className="rounded-2xl p-4 sm:p-6 md:p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          }}
        >
          <AdminGirisForm />
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 transition-colors hover:text-gray-300">
            ← Siteye Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
