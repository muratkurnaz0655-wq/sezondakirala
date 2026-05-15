import Link from "next/link";
import { CalendarDays, ExternalLink, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OwnerListingDeleteDialog } from "@/components/panel/owner-listing-delete-dialog";
import { isPublishedListing, LISTING_ONAY_DURUMU } from "@/lib/listing-approval";
import { formatCurrency } from "@/lib/utils/format";

export default async function OwnerListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: listings } = await supabase
    .from("ilanlar")
    .select("*")
    .eq("sahip_id", user.id)
    .order("olusturulma_tarihi", { ascending: false });

  const listingIds = (listings ?? []).map((item) => item.id);
  const { data: media } =
    listingIds.length > 0
      ? await supabase
          .from("ilan_medyalari")
          .select("ilan_id,url,sira")
          .in("ilan_id", listingIds)
          .order("sira", { ascending: true })
      : { data: [] as { ilan_id: string; url: string; sira: number }[] };

  const firstImageMap = new Map<string, string>();
  (media ?? []).forEach((row) => {
    if (!firstImageMap.has(row.ilan_id)) firstImageMap.set(row.ilan_id, row.url);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">İlanlarım</h1>
          <p className="mt-1 text-sm text-slate-600">
            Yeni ilanlar yönetici onayından sonra ana sayfada ve arama sonuçlarında görünür.
          </p>
        </div>
        <Link
          href="/panel/ilanlarim/yeni"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Yeni ilan ekle
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {(listings ?? []).length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
            <div className="text-4xl" aria-hidden>
              🏡
            </div>
            <p className="mt-3 text-sm font-medium text-slate-800">Henüz ilan yok</p>
            <p className="mt-1 text-sm text-slate-600">
              İlan ekledikten sonra durum burada &quot;Onay bekleniyor&quot; olarak görünür; onay sonrası
              yayına alınır.
            </p>
          </div>
        ) : null}

        {(listings ?? []).map((listing) => {
          const reddedildi = listing.onay_durumu === LISTING_ONAY_DURUMU.REJECTED;
          const yayinda = isPublishedListing(listing);
          const publicPath = listing.tip === "tekne" ? "tekneler" : "konaklama";
          const slugOrId = listing.slug ?? listing.id;

          return (
            <article
              key={listing.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100"
            >
              <div className="relative h-44 bg-slate-100">
                {firstImageMap.get(listing.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={firstImageMap.get(listing.id)}
                    alt={listing.baslik}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center text-sm text-slate-500">
                    <span>Görsel yok</span>
                    <span className="text-xs text-slate-400">Onaylı yayında kapak görseli önemlidir.</span>
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  {yayinda ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-600/95 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                      İlanınız yayında
                    </span>
                  ) : reddedildi ? (
                    <span className="inline-flex items-center rounded-full bg-rose-600/95 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                      Reddedildi
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/95 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                      Onay bekleniyor
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <h2 className="line-clamp-2 text-lg font-semibold text-slate-900">{listing.baslik}</h2>
                  <p className="mt-0.5 text-sm capitalize text-slate-500">{listing.tip}</p>
                  <p className="mt-2 text-base font-medium text-slate-800">
                    {formatCurrency(listing.gunluk_fiyat)}
                    <span className="text-sm font-normal text-slate-500"> / gece</span>
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/panel/takvim?ilan=${listing.id}`}
                    className="inline-flex flex-1 min-w-[8.5rem] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden />
                    Takvim
                  </Link>
                  <Link
                    href={`/panel/fiyat?ilan=${listing.id}`}
                    className="inline-flex flex-1 min-w-[8.5rem] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Tag className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                    Fiyatlar
                  </Link>
                  {yayinda ? (
                    <Link
                      href={`/${publicPath}/${slugOrId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 min-w-[8.5rem] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Önizle
                    </Link>
                  ) : (
                    <span
                      className="inline-flex flex-1 min-w-[8.5rem] cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400"
                      title="Yönetici onayından sonra herkese açık sayfada görüntülenebilir."
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                      Önizle
                    </span>
                  )}
                  <OwnerListingDeleteDialog listingId={listing.id} listingTitle={listing.baslik} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
