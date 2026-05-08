import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/guards";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminNewListingForm } from "./AdminNewListingForm";

export default async function AdminNewListingPage() {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    redirect("/yonetim/giris");
  }

  return (
    <AdminPageLayout
      title="Admin Yeni İlan Ekle"
      description="Bu ekran admin panelinden doğrudan ilan oluşturur. Fotoğraf ekleyebilir ve kapak görseli seçebilirsin."
    >
      <AdminNewListingForm />
    </AdminPageLayout>
  );
}
