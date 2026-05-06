import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Kayıt Ol",
    description: `${SITE_NAME} için yeni hesap oluşturun.`,
    openGraph: { title: "Kayıt Ol", description: `${SITE_NAME} için yeni hesap oluşturun.`, images: ["/og-image.jpg"] },
  };
}

export default function SignUpPage() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center bg-white py-10">
      <AuthForm mode="signup" />
    </div>
  );
}
