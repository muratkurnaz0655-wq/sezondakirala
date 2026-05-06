import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { getPublicSupabase } from "@/lib/supabase/public-anon";
import { createClient } from "@/lib/supabase/server";
import type { Ilan, Paket } from "@/types/supabase";

/** Oturumdan bağımsız katalog / yayın okumaları — girişli kullanıcıda RLS tutarlılığı için. */
async function dbForPublicReads() {
  const pub = getPublicSupabase();
  if (pub) return pub;
  return createClient();
}

async function attachPreviewImages(listings: Ilan[]) {
  if (!listings.length) return listings;
  if (!isSupabaseEnvConfigured()) return listings;
  const supabase = await dbForPublicReads();
  const listingIds = listings.map((item) => item.id);
  const { data: mediaRows } = await supabase
    .from("ilan_medyalari")
    .select("ilan_id,url,sira")
    .in("ilan_id", listingIds)
    .order("sira", { ascending: true });

  const firstImageByListing = new Map<string, string>();
  (mediaRows ?? []).forEach((row: { ilan_id: string; url: string }) => {
    if (!firstImageByListing.has(row.ilan_id)) {
      firstImageByListing.set(row.ilan_id, row.url);
    }
  });

  return listings.map((item) => ({
    ...item,
    ilk_resim_url: firstImageByListing.get(item.id) ?? null,
  }));
}

export async function getFeaturedPackages(category?: string) {
  if (!isSupabaseEnvConfigured()) return [];
  try {
    const supabase = await dbForPublicReads();
    let firstQuery = supabase
      .from("paketler")
      .select("*")
      .eq("aktif", true)
      .order("olusturulma_tarihi", { ascending: false })
      .order("id", { ascending: false })
      .limit(24);
    if (category && category !== "tumu") {
      firstQuery = firstQuery.eq("kategori", category);
    }
    const firstTry = await firstQuery;
    if (!firstTry.error) return (firstTry.data ?? []) as Paket[];

    let fallbackQuery = supabase
      .from("paketler")
      .select("*")
      .eq("aktif", true)
      .order("id", { ascending: false })
      .limit(24);
    if (category && category !== "tumu") {
      fallbackQuery = fallbackQuery.eq("kategori", category);
    }
    const fallback = await fallbackQuery;
    if (fallback.error) return [];
    return (fallback.data ?? []) as Paket[];
  } catch {
    return [];
  }
}

/** Ana sayfa paket bandı: kategori sekmeleri istemcide süzülür; tek seferde yeterli kayıt. */
export type PublicCatalogCounts = {
  villaCount: number;
  tekneCount: number;
  rezervasyonCount: number;
  averageRating: string;
};

export async function getPublicCatalogCounts(): Promise<PublicCatalogCounts | null> {
  if (!isSupabaseEnvConfigured()) return null;
  try {
    const supabase = await dbForPublicReads();
    const [v, b, r] = await Promise.all([
      supabase.from("ilanlar").select("*", { count: "exact", head: true }).eq("aktif", true).eq("tip", "villa"),
      supabase.from("ilanlar").select("*", { count: "exact", head: true }).eq("aktif", true).eq("tip", "tekne"),
      supabase.from("rezervasyonlar").select("*", { count: "exact", head: true }).eq("durum", "onaylandi"),
    ]);
    const { data: yorumlar } = await supabase.from("yorumlar").select("puan");
    const ortPuan = yorumlar?.length
      ? (yorumlar.reduce((sum, y) => sum + Number(y.puan ?? 0), 0) / yorumlar.length).toFixed(1)
      : "5.0";
    return {
      villaCount: v.count ?? 0,
      tekneCount: b.count ?? 0,
      rezervasyonCount: r.count ?? 0,
      averageRating: ortPuan,
    };
  } catch {
    return null;
  }
}

/** Ana sayfa önizlemesi — tam liste `/paketler`. */
export async function getHomeFeaturedPackages(limit = 3) {
  if (!isSupabaseEnvConfigured()) return [];
  try {
    const supabase = await dbForPublicReads();
    const safeLimit = Math.min(Math.max(1, limit), 12);
    const firstTry = await supabase
      .from("paketler")
      .select("*")
      .eq("aktif", true)
      .order("olusturulma_tarihi", { ascending: false })
      .order("id", { ascending: false })
      .limit(safeLimit);
    if (!firstTry.error) return (firstTry.data ?? []) as Paket[];

    const fallback = await supabase
      .from("paketler")
      .select("*")
      .eq("aktif", true)
      .order("id", { ascending: false })
      .limit(safeLimit);
    if (fallback.error) return [];
    return (fallback.data ?? []) as Paket[];
  } catch {
    return [];
  }
}

export async function getFeaturedListings() {
  if (!isSupabaseEnvConfigured()) return [];
  try {
    const supabase = await dbForPublicReads();
    const firstTry = await supabase
      .from("ilanlar")
      .select("*, ilan_medyalari(url,sira)")
      .eq("aktif", true)
      .order("sira", { foreignTable: "ilan_medyalari", ascending: true })
      .order("olusturulma_tarihi", { ascending: false })
      .order("id", { ascending: false })
      .limit(6);
    if (firstTry.error) {
      const fallback = await supabase
        .from("ilanlar")
        .select("*, ilan_medyalari(url,sira)")
        .eq("aktif", true)
        .order("sira", { foreignTable: "ilan_medyalari", ascending: true })
        .order("id", { ascending: false })
        .limit(6);
      if (fallback.error) return [];
      const rows = (fallback.data ?? []) as (Ilan & {
        ilan_medyalari?: { url: string; sira: number }[];
      })[];
      return rows.map((item) => ({
        ...item,
        ilk_resim_url: item.ilan_medyalari?.[0]?.url ?? "/images/villa-placeholder.svg",
      }));
    }
    const rows = (firstTry.data ?? []) as (Ilan & {
      ilan_medyalari?: { url: string; sira: number }[];
    })[];
    return rows.map((item) => ({
      ...item,
      ilk_resim_url: item.ilan_medyalari?.[0]?.url ?? "/images/villa-placeholder.svg",
    }));
  } catch {
    return [];
  }
}

export type TopCommentRow = {
  id: string;
  puan: number;
  yorum: string;
  ilan_id: string;
  kullanici_id: string;
  ilan_baslik: string | null;
  /** `kullanicilar.ad_soyad` join; yoksa arayüzde "Misafir" */
  misafir_ad: string | null;
};

type YorumSelectRow = {
  id: string;
  puan: number;
  yorum: string;
  ilan_id: string;
  kullanici_id: string;
  ilanlar: { baslik: string } | { baslik: string }[] | null;
  kullanicilar?: { ad_soyad: string | null } | { ad_soyad: string | null }[] | null;
};

function mapTopCommentRows(rows: YorumSelectRow[]): TopCommentRow[] {
  return rows.map((row) => {
    const ilanRel = row.ilanlar;
    const ilan = Array.isArray(ilanRel) ? ilanRel[0] : ilanRel;
    const kulRel = row.kullanicilar;
    const kul = kulRel ? (Array.isArray(kulRel) ? kulRel[0] : kulRel) : null;
    const ad = kul?.ad_soyad?.trim() || null;
    return {
      id: row.id,
      puan: row.puan,
      yorum: row.yorum,
      ilan_id: row.ilan_id,
      kullanici_id: row.kullanici_id,
      ilan_baslik: ilan?.baslik ?? null,
      misafir_ad: ad,
    };
  });
}

export async function getTopComments(): Promise<TopCommentRow[]> {
  if (!isSupabaseEnvConfigured()) return [];
  try {
    const supabase = await dbForPublicReads();
    const withUser = await supabase
      .from("yorumlar")
      .select("id,puan,yorum,ilan_id,kullanici_id,ilanlar(baslik),kullanicilar(ad_soyad)")
      .gte("puan", 4)
      .order("olusturulma_tarihi", { ascending: false })
      .limit(6);

    if (!withUser.error && withUser.data) {
      return mapTopCommentRows(withUser.data as YorumSelectRow[]);
    }

    const fallback = await supabase
      .from("yorumlar")
      .select("id,puan,yorum,ilan_id,kullanici_id,ilanlar(baslik)")
      .gte("puan", 4)
      .order("olusturulma_tarihi", { ascending: false })
      .limit(6);

    if (fallback.error) return [];

    return mapTopCommentRows((fallback.data ?? []) as YorumSelectRow[]);
  } catch {
    return [];
  }
}

export type ListingFilters = {
  tip: "villa" | "tekne";
  konum?: string;
  minFiyat?: number;
  maxFiyat?: number;
  kapasite?: number;
  yatakOdasi?: number;
  ozellikler?: string[];
  giris?: string;
  cikis?: string;
  /** Tekne listesi — baslik/aciklama üzerinde metin eşlemesi */
  tekneTipi?: string;
};

export async function getListingRegions(tip: "villa" | "tekne"): Promise<string[]> {
  if (!isSupabaseEnvConfigured()) return [];
  const supabase = await dbForPublicReads();
  const { data } = await supabase
    .from("ilanlar")
    .select("konum")
    .eq("aktif", true)
    .eq("tip", tip);

  const regions = new Set<string>();
  for (const row of data ?? []) {
    const konum = String(row.konum ?? "").trim();
    if (!konum) continue;
    const firstPart = konum.split(/[-,]/)[0]?.trim();
    if (firstPart) regions.add(firstPart);
  }
  return [...regions].sort((a, b) => a.localeCompare(b, "tr"));
}

export async function getFilteredListings(filters: ListingFilters) {
  if (!isSupabaseEnvConfigured()) return [];
  const supabase = await dbForPublicReads();
  let query = supabase
    .from("ilanlar")
    .select("*")
    .eq("aktif", true)
    .eq("tip", filters.tip)
    .order("olusturulma_tarihi", { ascending: false })
    .order("id", { ascending: false });

  if (filters.konum) query = query.ilike("konum", `%${filters.konum}%`);
  if (filters.minFiyat != null) query = query.gte("gunluk_fiyat", filters.minFiyat);
  if (filters.maxFiyat != null) query = query.lte("gunluk_fiyat", filters.maxFiyat);
  if (filters.kapasite != null) query = query.gte("kapasite", filters.kapasite);
  if (filters.yatakOdasi != null) query = query.gte("yatak_odasi", filters.yatakOdasi);

  let data: Ilan[] | null = null;
  const firstTry = await query;
  if (firstTry.error) {
    const fallbackQuery = supabase
      .from("ilanlar")
      .select("*")
      .eq("aktif", true)
      .eq("tip", filters.tip)
      .order("id", { ascending: false });
    if (filters.konum) query = fallbackQuery.ilike("konum", `%${filters.konum}%`);
    else query = fallbackQuery;
    if (filters.minFiyat != null) query = query.gte("gunluk_fiyat", filters.minFiyat);
    if (filters.maxFiyat != null) query = query.lte("gunluk_fiyat", filters.maxFiyat);
    if (filters.kapasite != null) query = query.gte("kapasite", filters.kapasite);
    if (filters.yatakOdasi != null) query = query.gte("yatak_odasi", filters.yatakOdasi);
    const fallback = await query;
    data = (fallback.data ?? []) as Ilan[];
  } else {
    data = (firstTry.data ?? []) as Ilan[];
  }
  let rows = data ?? [];

  if (filters.tip === "tekne" && filters.tekneTipi) {
    const tip = filters.tekneTipi.toLowerCase();
    const matchers: Record<string, RegExp> = {
      gulet: /gulet|gület/i,
      surat: /sürat|surat|speedboat/i,
      yelkenli: /yelken|sailing/i,
      katamaran: /katamaran/i,
    };
    const re = matchers[tip];
    if (re) {
      rows = rows.filter((listing) => re.test(listing.baslik) || re.test(listing.aciklama));
    }
  }

  let availabilityFilteredRows = rows;

  if (filters.giris && filters.cikis && rows.length > 0) {
    const listingIds = rows.map((item) => item.id);
    const [musaitlikRes, rezervasyonRes] = await Promise.all([
      supabase
        .from("musaitlik")
        .select("ilan_id")
        .in("ilan_id", listingIds)
        .eq("durum", "dolu")
        .gte("tarih", filters.giris)
        .lt("tarih", filters.cikis),
      supabase
        .from("rezervasyonlar")
        .select("ilan_id")
        .in("ilan_id", listingIds)
        .in("durum", ["beklemede", "onaylandi"])
        .lt("giris_tarihi", filters.cikis)
        .gt("cikis_tarihi", filters.giris),
    ]);

    const blockedIds = new Set<string>();
    (musaitlikRes.data ?? []).forEach((row) => blockedIds.add(row.ilan_id));
    (rezervasyonRes.data ?? []).forEach((row) => blockedIds.add(row.ilan_id));
    availabilityFilteredRows = rows.filter((listing) => !blockedIds.has(listing.id));
  }

  const filteredRows = !filters.ozellikler?.length
    ? availabilityFilteredRows
    : availabilityFilteredRows.filter((listing) =>
    filters.ozellikler!.every((feature) => listing.ozellikler?.[feature]),
  );

  return attachPreviewImages(filteredRows);
}

export async function getListingBySlug(tip: "villa" | "tekne", slug: string) {
  if (!isSupabaseEnvConfigured()) return null;
  const supabase = await dbForPublicReads();
  let { data: listing } = await supabase
    .from("ilanlar")
    .select("*")
    .eq("tip", tip)
    .eq("slug", slug)
    .eq("aktif", true)
    .maybeSingle();

  if (!listing) {
    const byOldSlug = await supabase
      .from("ilanlar")
      .select("*")
      .eq("tip", tip)
      .eq("old_slug", slug)
      .eq("aktif", true);
    listing =
      byOldSlug.data?.[0] ?? null;
  }

  if (!listing) {
    const fallback = await supabase
      .from("ilanlar")
      .select("*")
      .eq("tip", tip)
      .eq("id", slug)
      .eq("aktif", true)
      .maybeSingle();
    listing = fallback.data;
  }

  if (!listing) return null;

  const [mediaRes, availabilityRes, seasonsRes, reservationsRes, commentsRes, similarListingsRes] =
    await Promise.all([
      supabase
        .from("ilan_medyalari")
        .select("*")
        .eq("ilan_id", listing.id)
        .order("sira", { ascending: true }),
      supabase.from("musaitlik").select("*").eq("ilan_id", listing.id),
      supabase.from("sezon_fiyatlari").select("*").eq("ilan_id", listing.id),
      supabase
        .from("rezervasyonlar")
        .select("id,giris_tarihi,cikis_tarihi,durum")
        .eq("ilan_id", listing.id)
        .in("durum", ["beklemede", "onaylandi"]),
      supabase.from("yorumlar").select("*").eq("ilan_id", listing.id),
      supabase
        .from("ilanlar")
        .select("*")
        .eq("tip", tip)
        .eq("konum", listing.konum)
        .neq("id", listing.id)
        .eq("aktif", true)
        .order("sponsorlu", { ascending: false })
        .order("olusturulma_tarihi", { ascending: false })
        .limit(3),
    ]);

  const similarRaw = (similarListingsRes.data ?? []) as Ilan[];
  const similar = await attachPreviewImages(similarRaw);

  return {
    listing: listing as Ilan,
    media: mediaRes.data ?? [],
    availability: availabilityRes.data ?? [],
    seasonPrices: seasonsRes.data ?? [],
    reservations: reservationsRes.data ?? [],
    comments: commentsRes.data ?? [],
    similar,
  };
}
