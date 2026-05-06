import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { ListingDetailPage } from "@/components/listing-detail-page";
import { getListingBySlug } from "@/lib/data/phase2";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";

type ListingSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ListingSlugPage({ params }: ListingSlugPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: currentSlugListing } = await supabase
    .from("ilanlar")
    .select("id")
    .eq("tip", "villa")
    .eq("slug", slug)
    .eq("aktif", true)
    .maybeSingle();

  if (!currentSlugListing) {
    const { data: byOldSlug } = await supabase
      .from("ilanlar")
      .select("slug")
      .eq("tip", "villa")
      .eq("old_slug", slug)
      .eq("aktif", true)
      .maybeSingle();
    if (byOldSlug?.slug) permanentRedirect(`/konaklama/${byOldSlug.slug}`);
    notFound();
  }

  const cookieStore = await cookies();
  const rawArama = cookieStore.get("arama")?.value;
  let selectedDates:
    | { giris?: string; cikis?: string; yetiskin?: string; cocuk?: string; bebek?: string }
    | undefined;
  if (rawArama) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawArama)) as {
        giris?: string | null;
        cikis?: string | null;
        yetiskin?: number;
        cocuk?: number;
        bebek?: number;
      };
      selectedDates = {
        giris: parsed.giris ?? undefined,
        cikis: parsed.cikis ?? undefined,
        yetiskin: parsed.yetiskin != null ? String(parsed.yetiskin) : undefined,
        cocuk: parsed.cocuk != null ? String(parsed.cocuk) : undefined,
        bebek: parsed.bebek != null ? String(parsed.bebek) : undefined,
      };
    } catch {
      selectedDates = undefined;
    }
  }

  return <ListingDetailPage tip="villa" slug={slug} selectedDates={selectedDates} />;
}

export async function generateMetadata({
  params,
}: ListingSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getListingBySlug("villa", slug);
  const title = fixTurkishDisplay(detail?.listing.baslik ?? "Konaklama Detayı");
  const description =
    fixTurkishDisplay(detail?.listing.aciklama)?.slice(0, 160) ??
    "Fethiye villa kiralama ilan detayları.";

  return {
    title: `${title} — Fethiye Kiralama | ${SITE_NAME}`,
    description,
    openGraph: { title: `${title} — Fethiye Kiralama | ${SITE_NAME}`, description, images: ["/og-image.jpg"] },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Fethiye Kiralama | ${SITE_NAME}`,
      description,
      images: ["/og-image.jpg"],
    },
  };
}
