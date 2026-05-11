import type { Metadata } from "next";
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import "./globals.css";
import { GlobalWhatsappWidget } from "@/components/global-whatsapp-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_FAVICON_PATH } from "@/lib/constants";

const SITE_CANONICAL_ORIGIN = "https://www.sezondakirala.com";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CANONICAL_ORIGIN),
  title: "Sezonda Kirala | Fethiye Villa ve Tekne Kiralama | Sezondakirala",
  description:
    "Fethiye'de sezonda kirala fırsatları. Sezondakirala ile lüks villa ve özel tekne kiralama. TURSAB güvencesiyle unutulmaz tatil deneyimi.",
  keywords:
    "sezonda kirala, sezondakirala, fethiye villa kiralama, fethiye tekne kiralama, fethiye kiralık villa, yazlık kiralama fethiye, sezon kiralama",
  openGraph: {
    title: "Sezonda Kirala | Fethiye Villa ve Tekne Kiralama",
    description: "Fethiye'de sezonda kirala fırsatları. Lüks villa ve özel tekne kiralama.",
    url: SITE_CANONICAL_ORIGIN,
    siteName: "Sezondakirala",
    locale: "tr_TR",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sezonda Kirala | Fethiye Villa ve Tekne Kiralama",
    description: "Fethiye'de sezonda kirala fırsatları. Lüks villa ve özel tekne kiralama.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: SITE_CANONICAL_ORIGIN,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: SITE_FAVICON_PATH,
    shortcut: SITE_FAVICON_PATH,
    apple: SITE_FAVICON_PATH,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/yonetim");
  const isSssPage = pathname === "/sss" || pathname.startsWith("/sss/");

  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        suppressHydrationWarning
        className={
          isAdmin
            ? "min-h-full bg-white text-[var(--color-text)] antialiased"
            : "flex min-h-full flex-col bg-white text-[var(--color-text)] antialiased"
        }
        style={undefined}
      >
        {!isAdmin && <SiteHeader />}
        {isAdmin ? (
          children
        ) : (
          <main
            className={
              isSssPage
                ? "page-fade-in flex w-full flex-1 px-0 pb-8"
                : "page-fade-in flex w-full flex-1 px-4 pb-8 md:px-6 lg:px-8"
            }
          >
            {children}
          </main>
        )}
        {!isAdmin && <SiteFooter />}
        {!isAdmin && <GlobalWhatsappWidget />}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
