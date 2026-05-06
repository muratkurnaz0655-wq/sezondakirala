import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePaketListingIds } from "@/lib/paket-ilan-idleri";
import { formatCurrency } from "@/lib/utils/format";
import { getPlatformSettings } from "@/lib/settings";
import type { Ilan, Paket } from "@/types/supabase";

type PackageDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const settings = await getPlatformSettings();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

  if (uuidRegex.test(slug)) {
    const { data: found } = await supabase.from("paketler").select("slug").eq("id", slug).maybeSingle();
    if (found?.slug) permanentRedirect(`/paketler/${found.slug}`);
    notFound();
  }

  const { data: paket } = await supabase.from("paketler").select("*").eq("slug", slug).eq("aktif", true).maybeSingle();

  if (!paket) {
    notFound();
  }

  const listingIds = normalizePaketListingIds((paket as Paket).ilan_idleri);
  const { data: packageMediaRows } = await supabase
    .from("paket_medyalari")
    .select("id,url,tip,sira")
    .eq("paket_id", paket.id)
    .order("sira", { ascending: true });
  const detailImages = (packageMediaRows ?? []).filter((row) => row.tip === "detay");
  const coverFromMedia = (packageMediaRows ?? []).find((row) => row.tip === "kapak")?.url ?? null;
  const coverImage = paket.gorsel_url ?? coverFromMedia;
  const { data: packageListingsRaw } = listingIds.length
    ? await supabase
        .from("ilanlar")
        .select("id,baslik,konum,gunluk_fiyat,slug,tip,ilan_medyalari(url,sira)")
        .in("id", listingIds)
        .eq("aktif", true)
        .order("sira", { foreignTable: "ilan_medyalari", ascending: true })
    : { data: [] };

  type Row = Ilan & { ilan_medyalari?: { url: string; sira: number }[] };
  const packageListings = ((packageListingsRaw ?? []) as Row[]).map((row) => ({
    ...row,
    ilk_resim_url: row.ilan_medyalari?.[0]?.url ?? "/images/villa-placeholder.svg",
  }));

  /** Paket için rezervasyon URL'i slug tabanlıdır. */
  const rezervasyonHref =
    listingIds.length && packageListings.length ? `/rezervasyon/${paket.slug}?paket=${paket.slug}` : null;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative h-72 bg-gradient-to-r from-sky-500 to-emerald-500 p-6 text-white">
          {coverImage ? (
            <>
              <Image src={coverImage} alt={paket.baslik} fill className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-black/35" />
            </>
          ) : null}
          <div className="relative z-10">
            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {paket.kategori}
            </span>
            <h1 className="mt-3 text-4xl font-semibold">{paket.baslik}</h1>
            <p className="mt-3 max-w-2xl text-sky-50">{paket.aciklama}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Bu pakete dahil olanlar</h2>
          <ul className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <li>✓ Konaklama seçilen ilanda yapılır</li>
            <li>✓ Transfer ve destek ekibi dahildir</li>
            <li>✓ Aktivite planı paket tipine göre sunulur</li>
          </ul>
          <h3 className="pt-1 text-lg font-semibold text-slate-900">Dahil olan ilanlar</h3>
          {packageListings.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {packageListings.map((listing) => {
                const safeSlug = listing.slug || listing.id;
                const href = listing.tip === "tekne" ? `/tekneler/${safeSlug}` : `/konaklama/${safeSlug}`;
                const cover =
                  "ilk_resim_url" in listing && listing.ilk_resim_url
                    ? String(listing.ilk_resim_url)
                    : "/images/villa-placeholder.svg";
                return (
                  <Link
                    key={listing.id}
                    href={href}
                    className="flex gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-sky-300"
                  >
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={cover} alt="" fill className="object-cover" sizes="112px" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{listing.baslik}</p>
                      <p className="mt-1 text-sm text-slate-600">{listing.konum}</p>
                      <p className="mt-1 text-sm font-semibold text-sky-700">
                        {formatCurrency(listing.gunluk_fiyat)} / gece
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Bu paket için veritabanında ilan bağlantısı yok veya ilanlar şu an yayında değil.
            </p>
          )}
          {detailImages.length ? (
            <div>
              <h3 className="pb-2 pt-1 text-lg font-semibold text-slate-900">Paketten Detay Fotoğraflar</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {detailImages.map((media) => (
                  <div key={media.id} className="relative h-36 overflow-hidden rounded-xl border border-slate-200">
                    <Image src={media.url} alt="Paket detay fotoğrafı" fill className="object-cover" sizes="33vw" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Örnek program</h3>
            <ol className="mt-2 space-y-2 text-sm text-slate-700">
              <li>1. gün: Karşılama ve yerleşme</li>
              <li>2. gün: Bölge keşfi ve aktivite</li>
              <li>3. gün: Serbest zaman ve tatil keyfi</li>
            </ol>
          </div>
        </div>

        <aside className="relative z-40 h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
          <h3 className="text-lg font-semibold text-slate-900">Paket Özeti</h3>
          <p className="text-sm text-slate-600">Süre: {paket.sure_gun} gün</p>
          <p className="text-sm text-slate-600">Kapasite: {paket.kapasite} kişi</p>
          <p className="text-2xl font-bold text-sky-700">{formatCurrency(paket.fiyat)}</p>
          {rezervasyonHref ? (
            <Link
              href={rezervasyonHref}
              className="inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Rezervasyon Yap
            </Link>
          ) : (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
              Bu paket için rezervasyon ilanı bağlı değil. WhatsApp ile iletişime geçebilirsiniz.
            </p>
          )}
          <Link
            href={`https://wa.me/${settings.whatsappNumber}`}
            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            WhatsApp ile bilgi al
          </Link>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            TURSAB güvenceli rezervasyon
          </div>
        </aside>
      </div>
    </section>
  );
}
