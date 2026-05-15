import type { Ilan } from "@/types/supabase";

type ListingWithMedia = Ilan & {
  ilan_medyalari?: { url: string; sira: number; tip?: string }[] | null;
};

/** Sunucu katalog API — tarayıcıda anon RLS tutarsızlığını aşar. */
export async function fetchPublishedListingsFromApi(
  tip: "villa" | "tekne",
  limit = 200,
): Promise<ListingWithMedia[]> {
  const res = await fetch(`/api/public/ilanlar?tip=${tip}&limit=${limit}`, { cache: "no-store" });
  if (!res.ok) {
    console.error("[fetchPublishedListingsFromApi]", res.status, await res.text().catch(() => ""));
    return [];
  }
  const data: unknown = await res.json();
  return Array.isArray(data) ? (data as ListingWithMedia[]) : [];
}
