import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isMissingOnayDurumuColumn,
  isPublishedListing,
  isPublishedPackage,
  LISTING_ONAY_DURUMU,
} from "@/lib/listing-approval";
import type { Ilan, Paket } from "@/types/supabase";
import { isExcludedDraftListing } from "@/lib/utils/excluded-draft-listing";
import { isExcludedDraftPackage } from "@/lib/utils/excluded-draft-package";

export function isCatalogSchemaError(error: { message?: string; code?: string } | null | undefined) {
  return isSchemaError(error);
}

type ListingWithMedia = Ilan & { ilan_medyalari?: { url: string; sira: number; tip?: string }[] | null };

function isSchemaError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return false;
  if (isMissingOnayDurumuColumn(error)) return true;
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "42703" ||
    code === "PGRST204" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache") ||
    msg.includes("could not find")
  );
}

function filterPublishedListings(rows: ListingWithMedia[]) {
  return rows
    .filter((row) => !isExcludedDraftListing(row))
    .filter((row) => isPublishedListing(row));
}

function filterPublishedPackages(rows: (Paket & { onay_durumu?: string | null })[]) {
  return rows.filter((p) => !isExcludedDraftPackage(p)).filter((p) => isPublishedPackage(p));
}

/** Kamuya açık villa/tekne listesi — eksik kolon / sıralama hatalarında yedek sorgular */
export async function queryPublishedListings(
  supabase: SupabaseClient,
  options: { tip: "villa" | "tekne"; limit?: number },
): Promise<ListingWithMedia[]> {
  const limit = options.limit ?? 120;
  const selectWithMedia = "*, ilan_medyalari(url,sira,tip)";

  type Builder = (withOnay: boolean) => PromiseLike<{ data: unknown; error: { message?: string; code?: string } | null }>;
  const builders: Builder[] = [
    (withOnay) => {
      let q = supabase
        .from("ilanlar")
        .select(selectWithMedia)
        .eq("aktif", true)
        .eq("tip", options.tip)
        .limit(limit);
      if (withOnay) q = q.eq("onay_durumu", LISTING_ONAY_DURUMU.PUBLISHED);
      return q.order("sponsorlu", { ascending: false }).order("olusturulma_tarihi", { ascending: false });
    },
    (withOnay) => {
      let q = supabase.from("ilanlar").select(selectWithMedia).eq("aktif", true).eq("tip", options.tip).limit(limit);
      if (withOnay) q = q.eq("onay_durumu", LISTING_ONAY_DURUMU.PUBLISHED);
      return q.order("olusturulma_tarihi", { ascending: false });
    },
    (withOnay) => {
      let q = supabase.from("ilanlar").select(selectWithMedia).eq("aktif", true).eq("tip", options.tip).limit(limit);
      if (withOnay) q = q.eq("onay_durumu", LISTING_ONAY_DURUMU.PUBLISHED);
      return q.order("id", { ascending: false });
    },
    (withOnay) => {
      let q = supabase.from("ilanlar").select("*").eq("aktif", true).eq("tip", options.tip).limit(limit);
      if (withOnay) q = q.eq("onay_durumu", LISTING_ONAY_DURUMU.PUBLISHED);
      return q.order("id", { ascending: false });
    },
    (withOnay) => {
      let q = supabase.from("ilanlar").select("*").eq("aktif", true).eq("tip", options.tip).limit(limit);
      if (withOnay) q = q.eq("onay_durumu", LISTING_ONAY_DURUMU.PUBLISHED);
      return q;
    },
  ];

  for (const build of builders) {
    for (const withOnay of [true, false] as const) {
      const res = await build(withOnay);
      if (!res.error) {
        return filterPublishedListings((res.data ?? []) as ListingWithMedia[]);
      }
      if (!isSchemaError(res.error)) {
        console.error("[queryPublishedListings]", res.error);
        break;
      }
    }
  }
  return [];
}

export async function queryPublishedPackages(
  supabase: SupabaseClient,
  options: { category?: string; limit?: number },
): Promise<Paket[]> {
  const limit = options.limit ?? 24;

  const builders = [
    () => {
      let q = supabase
        .from("paketler")
        .select("*")
        .eq("aktif", true)
        .eq("onay_durumu", LISTING_ONAY_DURUMU.PUBLISHED)
        .order("olusturulma_tarihi", { ascending: false })
        .limit(limit);
      if (options.category && options.category !== "tumu") q = q.eq("kategori", options.category);
      return q;
    },
    () => {
      let q = supabase
        .from("paketler")
        .select("*")
        .eq("aktif", true)
        .eq("onay_durumu", LISTING_ONAY_DURUMU.PUBLISHED)
        .order("id", { ascending: false })
        .limit(limit);
      if (options.category && options.category !== "tumu") q = q.eq("kategori", options.category);
      return q;
    },
    () => {
      let q = supabase
        .from("paketler")
        .select("*")
        .eq("aktif", true)
        .order("olusturulma_tarihi", { ascending: false })
        .limit(limit);
      if (options.category && options.category !== "tumu") q = q.eq("kategori", options.category);
      return q;
    },
    () => {
      let q = supabase.from("paketler").select("*").eq("aktif", true).order("id", { ascending: false }).limit(limit);
      if (options.category && options.category !== "tumu") q = q.eq("kategori", options.category);
      return q;
    },
  ];

  for (const build of builders) {
    const res = await build();
    if (!res.error) {
      const rows = filterPublishedPackages((res.data ?? []) as (Paket & { onay_durumu?: string | null })[]);
      if (rows.length > 0) return rows;
    } else if (!isSchemaError(res.error)) {
      console.error("[queryPublishedPackages]", res.error);
    }
  }
  return [];
}
