import { createClient } from "@/lib/supabase/server";
import { OwnerPriceManager } from "@/components/owner-price-manager";

type PanelFiyatPageProps = {
  searchParams: Promise<{ ilan?: string }>;
};

export default async function PanelPricePage({ searchParams }: PanelFiyatPageProps) {
  const sp = await searchParams;
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
  type SeasonPriceRow = {
    id: string;
    ilan_id: string;
    baslangic_tarihi: string;
    bitis_tarihi: string;
    gunluk_fiyat: number;
  };
  const { data: seasonPrices } = listingIds.length
    ? await supabase
        .from("sezon_fiyatlari")
        .select("*")
        .in("ilan_id", listingIds)
        .order("baslangic_tarihi", { ascending: false })
    : { data: [] as SeasonPriceRow[] };

  const preferredIlan =
    typeof sp.ilan === "string" && sp.ilan.length > 0 ? sp.ilan : undefined;

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sezon Fiyatları</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tarih aralığına göre gecelik fiyat belirleyin; liste ve arama bu fiyatları kullanır.
        </p>
      </div>
      <OwnerPriceManager
        listings={ownerListings ?? []}
        seasonPrices={seasonPrices ?? []}
        defaultListingId={preferredIlan}
      />
    </div>
  );
}
