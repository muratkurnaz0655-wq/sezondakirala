import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Giriş Yap",
    description: `${SITE_NAME} hesabınıza giriş yapın.`,
    openGraph: { title: "Giriş Yap", description: `${SITE_NAME} hesabınıza giriş yapın.`, images: ["/og-image.jpg"] },
  };
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8FAFC] px-4">
      <AuthForm mode="signin" />
    </div>
  );
}
