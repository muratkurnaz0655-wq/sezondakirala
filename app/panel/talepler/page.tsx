import { createClient } from "@/lib/supabase/server";
import { updateReservationStatus } from "@/app/actions/owner";
import { formatCurrency } from "@/lib/utils/format";

export default async function PanelRequestsPage() {
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
  type RequestRow = {
    id: string;
    ilan_id: string;
    giris_tarihi: string;
    cikis_tarihi: string;
    misafir_sayisi: number;
    toplam_fiyat: number;
    durum: string;
  };
  const { data: requests } = listingIds.length
    ? await supabase
        .from("rezervasyonlar")
        .select("*")
        .in("ilan_id", listingIds)
        .order("olusturulma_tarihi", { ascending: false })
    : { data: [] as RequestRow[] };

  return (
    <div className="space-y-4 overflow-x-hidden">
      <h1 className="text-lg font-semibold text-slate-900 sm:text-xl md:text-2xl">Gelen Talepler</h1>

      <div className="block space-y-3 sm:hidden">
        {(requests ?? []).length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="text-4xl">📨</div>
            <p className="mt-2 text-sm text-slate-700">Henüz talep yok.</p>
          </div>
        ) : null}
        {(requests ?? []).map((row) => (
          <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">
              {(ownerListings ?? []).find((listing) => listing.id === row.ilan_id)?.baslik ?? "-"}
            </p>
            <p className="mt-1 text-xs text-slate-500">{row.giris_tarihi} - {row.cikis_tarihi}</p>
            <p className="mt-1 text-xs text-slate-600">{row.misafir_sayisi} kişi</p>
            <p className="mt-2 text-sm font-semibold text-[#0e9aa7]">{formatCurrency(row.toplam_fiyat)}</p>
            <div className="mt-3 flex gap-2">
              <form action={updateReservationStatus} className="flex-1">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="durum" value="onaylandi" />
                <button type="submit" className="w-full rounded-md border border-green-300 px-2 py-2 text-xs text-green-700">Onayla</button>
              </form>
              <form action={updateReservationStatus} className="flex-1">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="durum" value="iptal" />
                <button type="submit" className="w-full rounded-md border border-red-300 px-2 py-2 text-xs text-red-600">Reddet</button>
              </form>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white sm:block">
        {(requests ?? []).length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl">📨</div>
            <p className="mt-2 text-sm text-slate-700">Henüz talep yok.</p>
            <p className="text-xs text-slate-500">Gelen rezervasyon talepleri burada görünecek.</p>
          </div>
        ) : null}
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Ilan</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Misafir</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Islem</th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {(ownerListings ?? []).find((listing) => listing.id === row.ilan_id)?.baslik ??
                    "-"}
                </td>
                <td className="px-4 py-3">
                  {row.giris_tarihi} - {row.cikis_tarihi}
                </td>
                <td className="px-4 py-3">{row.misafir_sayisi}</td>
                <td className="px-4 py-3">{formatCurrency(row.toplam_fiyat)}</td>
                <td className="px-4 py-3">{row.durum}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <form action={updateReservationStatus}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="durum" value="onaylandi" />
                      <button
                        type="submit"
                        className="rounded-md border border-green-300 px-2 py-1 text-xs text-green-700"
                      >
                        Onayla
                      </button>
                    </form>
                    <form action={updateReservationStatus}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="durum" value="iptal" />
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600"
                      >
                        Reddet
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
