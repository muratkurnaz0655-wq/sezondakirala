import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ListingDetailPage } from "@/components/listing-detail-page";
import { getListingBySlug } from "@/lib/data/phase2";
import { SITE_NAME } from "@/lib/constants";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";

type BoatSlugPageProps = {
  params: Promise<{ slug: string }>;
};

function isoDateWithOffset(baseIso: string, dayOffset: number) {
  const baseDate = new Date(`${baseIso}T00:00:00`);
  baseDate.setDate(baseDate.getDate() + dayOffset);
  return baseDate.toISOString().slice(0, 10);
}

export default async function BoatSlugPage({ params }: BoatSlugPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const todayIso = new Date().toISOString().slice(0, 10);
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
      };
      const fallbackGiris = parsed.giris ?? todayIso;
      const fallbackCikis = parsed.cikis ?? isoDateWithOffset(fallbackGiris, 1);
      selectedDates = {
        giris: fallbackGiris,
        cikis: fallbackCikis,
        yetiskin: parsed.yetiskin != null ? String(parsed.yetiskin) : undefined,
        cocuk: "0",
        bebek: "0",
      };
    } catch {
      selectedDates = {
        giris: todayIso,
        cikis: isoDateWithOffset(todayIso, 1),
        yetiskin: "2",
        cocuk: "0",
        bebek: "0",
      };
    }
  } else {
    selectedDates = {
      giris: todayIso,
      cikis: isoDateWithOffset(todayIso, 1),
      yetiskin: "2",
      cocuk: "0",
      bebek: "0",
    };
  }
  return <ListingDetailPage tip="tekne" slug={slug} selectedDates={selectedDates} />;
}

export async function generateMetadata({
  params,
}: BoatSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getListingBySlug("tekne", slug);
  const title = fixTurkishDisplay(detail?.listing.baslik ?? "Tekne Detayı");
  const description =
    fixTurkishDisplay(detail?.listing.aciklama)?.slice(0, 160) ??
    "Fethiye tekne kiralama ilan detayları.";

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
