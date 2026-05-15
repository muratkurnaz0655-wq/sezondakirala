import { notFound } from "next/navigation";
import { AdminListingCalendarManager } from "@/components/admin-listing-calendar-manager";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";

type AdminListingCalendarPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminListingCalendarPage({ params }: AdminListingCalendarPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: listing } = await supabase
    .from("ilanlar")
    .select("id,baslik,tip,gunluk_fiyat")
    .eq("id", id)
    .maybeSingle();

  if (!listing) notFound();

  const [musaitlikRes, sezonRes, rezervasyonRes] = await Promise.all([
    supabase
      .from("musaitlik")
      .select("id,tarih,durum,fiyat_override")
      .eq("ilan_id", id)
      .order("tarih", { ascending: true }),
    supabase
      .from("sezon_fiyatlari")
      .select("id,baslangic_tarihi,bitis_tarihi,gunluk_fiyat")
      .eq("ilan_id", id)
      .order("baslangic_tarihi", { ascending: true }),
    supabase
      .from("rezervasyonlar")
      .select("id,giris_tarihi,cikis_tarihi,durum")
      .eq("ilan_id", id)
      .in("durum", ["onaylandi", "beklemede", "pending", "onay_bekliyor"])
      .order("giris_tarihi", { ascending: true }),
  ]);

  if (musaitlikRes.error) {
    console.error("[admin-takvim] musaitlik:", musaitlikRes.error);
  }

  return (
    <AdminPageLayout
      title="İlan Takvimi"
      description={`${listing.baslik} · ${listing.tip} · ${formatCurrency(listing.gunluk_fiyat)}/gece`}
    >
      <AdminListingCalendarManager
        variant="admin"
        ilanId={listing.id}
        musaitlik={musaitlikRes.data ?? []}
        sezonFiyatlari={sezonRes.data ?? []}
        rezervasyonlar={rezervasyonRes.data ?? []}
      />
    </AdminPageLayout>
  );
}
