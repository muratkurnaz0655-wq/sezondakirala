import { upsertSeasonPrice } from "@/app/actions/owner";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";

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
  const defaultSelectIlan =
    preferredIlan && (ownerListings ?? []).some((l) => l.id === preferredIlan)
      ? preferredIlan
      : "";

  return (
    <div className="space-y-4 overflow-x-hidden">
      <h1 className="text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">Sezon Fiyatlari</h1>

      <form action={upsertSeasonPrice} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <select
          name="ilan_id"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          required
          defaultValue={defaultSelectIlan}
        >
          <option value="">Ilan secin</option>
          {(ownerListings ?? []).map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.baslik}
            </option>
          ))}
        </select>
        <input name="baslangic_tarihi" type="date" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="bitis_tarihi" type="date" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="gunluk_fiyat" type="number" required placeholder="Gunluk fiyat" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button className="w-full sm:w-auto rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white md:col-span-4" type="submit">
          Sezon Fiyati Ekle
        </button>
      </form>

      <div className="block space-y-3 sm:hidden">
        {(seasonPrices ?? []).map((row) => (
          <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">
              {(ownerListings ?? []).find((listing) => listing.id === row.ilan_id)?.baslik ?? "-"}
            </p>
            <p className="mt-1 text-xs text-slate-500">{row.baslangic_tarihi} - {row.bitis_tarihi}</p>
            <p className="mt-2 text-base font-bold text-[#0e9aa7]">{formatCurrency(row.gunluk_fiyat)}</p>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white sm:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Ilan</th>
              <th className="px-4 py-3">Baslangic</th>
              <th className="px-4 py-3">Bitis</th>
              <th className="px-4 py-3">Fiyat</th>
            </tr>
          </thead>
          <tbody>
            {(seasonPrices ?? []).map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {(ownerListings ?? []).find((listing) => listing.id === row.ilan_id)?.baslik ??
                    "-"}
                </td>
                <td className="px-4 py-3">{row.baslangic_tarihi}</td>
                <td className="px-4 py-3">{row.bitis_tarihi}</td>
                <td className="px-4 py-3">{formatCurrency(row.gunluk_fiyat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
