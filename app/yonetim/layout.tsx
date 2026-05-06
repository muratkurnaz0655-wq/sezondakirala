import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Admin Panel | ${SITE_NAME}`,
  description: "Platform yönetim ekranı.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Admin Paneli",
    description: "Platform yönetim ekranı.",
    images: ["/og-image.jpg"],
  },
};

export default function YonetimRootLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)",
      }}
    >
      {children}
    </div>
  );
}
