import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePaketListingIds } from "@/lib/paket-ilan-idleri";

type AdminPackageCalendarPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPackageCalendarPage({ params }: AdminPackageCalendarPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: paket } = await supabase
    .from("paketler")
    .select("id,baslik,ilan_idleri")
    .eq("id", id)
    .maybeSingle();
  if (!paket) notFound();

  const listingIds = normalizePaketListingIds(paket.ilan_idleri);
  const { data: listings } = listingIds.length
    ? await supabase
        .from("ilanlar")
        .select("id,baslik,tip,konum")
        .in("id", listingIds)
    : { data: [] };
  const orderMap = new Map(listingIds.map((value, index) => [value, index]));
  const orderedListings = (listings ?? []).sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
  );

  return (
    <AdminPageLayout
      title="Paket Müsaitlik Takvimi"
      description={`${paket.baslik} paketine bağlı ilanların takvimlerini buradan yönetebilirsin.`}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        {orderedListings.length === 0 ? (
          <p className="text-sm text-slate-500">Bu pakete bağlı ilan bulunamadı.</p>
        ) : (
          <div className="space-y-3">
            {orderedListings.map((listing) => (
              <div
                key={listing.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{listing.baslik}</p>
                  <p className="text-xs text-slate-500">
                    {listing.tip === "tekne" ? "Tekne" : "Villa"} · {listing.konum}
                  </p>
                </div>
                <Link
                  href={`/yonetim/ilanlar/${listing.id}/takvim`}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  İlan Takvimine Git
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
