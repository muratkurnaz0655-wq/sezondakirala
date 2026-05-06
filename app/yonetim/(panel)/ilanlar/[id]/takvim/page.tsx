import { notFound } from "next/navigation";
import { AdminListingCalendarManager } from "@/components/admin-listing-calendar-manager";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";

type AdminListingCalendarPageProps = {
  params: Promise<{ id: string }>;
};

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
      .select("id,tarih,durum")
      .eq("ilan_id", id)
      .order("tarih", { ascending: true }),
    supabase
      .from("sezon_fiyatlari")
      .select("id,baslangic_tarihi,bitis_tarihi,gunluk_fiyat")
      .eq("ilan_id", id)
      .order("baslangic_tarihi", { ascending: true }),
    supabase
      .from("rezervasyonlar")
      .select("id,giris_tarihi,cikis_tarihi")
      .eq("ilan_id", id)
      .eq("durum", "onaylandi")
      .order("giris_tarihi", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="admin-card p-6">
        <h1 className="text-2xl font-bold text-slate-900">İlan Takvimi</h1>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{listing.baslik}</span> · {listing.tip} ·{" "}
          {formatCurrency(listing.gunluk_fiyat)}/gece
        </p>
      </div>

      <AdminListingCalendarManager
        variant="admin"
        ilanId={listing.id}
        musaitlik={musaitlikRes.data ?? []}
        sezonFiyatlari={sezonRes.data ?? []}
        rezervasyonlar={rezervasyonRes.data ?? []}
      />
    </div>
  );
}
