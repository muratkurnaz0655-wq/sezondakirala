import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminPackageCreateForm } from "../AdminPackageCreateForm";

export default async function AdminNewPackagePage() {
  const admin = await requireAdminUser();
  if (!admin.ok) {
    redirect("/yonetim/giris");
  }

  const supabase = createAdminClient();
  const { data: listings } = await supabase
    .from("ilanlar")
    .select("id,baslik,tip,ilan_medyalari(url,sira)")
    .order("olusturulma_tarihi", { ascending: false });

  const firstImageMap = new Map<string, string>();
  (listings ?? []).forEach((listing) => {
    const media = (listing.ilan_medyalari ?? []) as { url: string; sira: number }[];
    const first = [...media].sort((a, b) => a.sira - b.sira)[0]?.url;
    if (first) firstImageMap.set(listing.id, first);
  });

  return (
    <AdminPageLayout
      title="Admin Yeni Paket Ekle"
      description="Paket oluştururken en az bir villa ve bir tekne seçimi zorunludur."
    >
      <AdminPackageCreateForm
        listings={(listings ?? []).map((listing) => ({
          id: listing.id,
          baslik: listing.baslik,
          tip: listing.tip ?? "villa",
          imageUrl: firstImageMap.get(listing.id) ?? null,
        }))}
      />
    </AdminPageLayout>
  );
}
