import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/guards";
import { AdminNewListingForm } from "./AdminNewListingForm";

export default async function AdminNewListingPage() {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    redirect("/yonetim/giris");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Yeni İlan Ekle</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bu ekran admin panelinden doğrudan ilan oluşturur. Fotoğraf ekleyebilir ve kapak görseli seçebilirsin.
        </p>
      </div>
      <AdminNewListingForm />
    </div>
  );
}
