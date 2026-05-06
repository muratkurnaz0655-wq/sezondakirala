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
    <div className="flex w-full flex-1 flex-col items-center justify-center bg-white py-10">
      <AuthForm mode="signin" />
    </div>
  );
}
