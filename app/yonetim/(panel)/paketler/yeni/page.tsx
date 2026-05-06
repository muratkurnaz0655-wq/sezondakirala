import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Yeni Paket Ekle</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paket oluştururken en az bir villa ve bir tekne seçimi zorunludur.
        </p>
      </div>
      <AdminPackageCreateForm
        listings={(listings ?? []).map((listing) => ({
          id: listing.id,
          baslik: listing.baslik,
          tip: listing.tip ?? "villa",
          imageUrl: firstImageMap.get(listing.id) ?? null,
        }))}
      />
    </div>
  );
}
