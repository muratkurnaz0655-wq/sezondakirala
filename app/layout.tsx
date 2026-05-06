import type { Metadata } from "next";
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import "./globals.css";
import { GlobalWhatsappWidget } from "@/components/global-whatsapp-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_FAVICON_PATH, SITE_NAME, SITE_URL } from "@/lib/constants";

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

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: "Fethiye'de villa ve tekne kiralama platformu",
    openGraph: {
      title: SITE_NAME,
      description: "Fethiye'de villa ve tekne kiralama platformu",
      images: ["/og-image.jpg"],
    },
    icons: {
      icon: SITE_FAVICON_PATH,
      shortcut: SITE_FAVICON_PATH,
      apple: SITE_FAVICON_PATH,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/yonetim");

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
          <main className="page-fade-in flex w-full flex-1 px-4 pb-8 md:px-6 lg:px-8">
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
