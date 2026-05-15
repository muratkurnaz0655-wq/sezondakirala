import { createClient } from "@/lib/supabase/server";
import { OwnerCalendarManager } from "@/components/owner-calendar-manager";

type PanelTakvimPageProps = {
  searchParams: Promise<{ ilan?: string }>;
};

export default async function PanelCalendarPage({ searchParams }: PanelTakvimPageProps) {
  const sp = await searchParams;
  const preferredListingId =
    typeof sp.ilan === "string" && sp.ilan.length > 0 ? sp.ilan : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ownerListings } = await supabase
    .from("ilanlar")
    .select("id,baslik")
    .eq("sahip_id", user.id);
  const listingIds = (ownerListings ?? []).map((row) => row.id);
  const [{ data: availability }, { data: seasonPrices }, { data: reservations }] = listingIds.length
    ? await Promise.all([
        supabase.from("musaitlik").select("id,ilan_id,tarih,durum").in("ilan_id", listingIds),
        supabase
          .from("sezon_fiyatlari")
          .select("id,ilan_id,baslangic_tarihi,bitis_tarihi,gunluk_fiyat")
          .in("ilan_id", listingIds),
        supabase
          .from("rezervasyonlar")
          .select("id,ilan_id,giris_tarihi,cikis_tarihi,durum")
          .in("ilan_id", listingIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Takvim Yönetimi</h1>
        <p className="mt-1 text-sm text-slate-600">
          Dolu günleri işaretleyin, özel fiyat tanımlayın ve onaylı rezervasyonları görüntüleyin.
        </p>
      </div>
      <OwnerCalendarManager
        listings={ownerListings ?? []}
        defaultListingId={preferredListingId}
        availability={availability ?? []}
        seasonPrices={seasonPrices ?? []}
        reservations={reservations ?? []}
      />
    </div>
  );
}
