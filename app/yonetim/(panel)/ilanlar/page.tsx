import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { Home, Plus } from "lucide-react";
import { ListingActions } from "./ListingActions";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminFormField, AdminInput, AdminSelect } from "@/components/admin/AdminFormControls";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminMobileCard, AdminMobileCardList } from "@/components/admin/AdminMobileCardList";
import { AdminSegmentedTabs } from "@/components/admin/AdminSegmentedTabs";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { listingCoverImageUrl } from "./listing-cover";
import { ListingsBulkTable, type ListingTableRow } from "./ListingsBulkTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

type AdminListingsPageProps = {
  searchParams: Promise<{
    durum?: string;
    filtre?: string;
    q?: string;
    min_fiyat?: string;
    max_fiyat?: string;
    konum?: string;
    sahip?: string;
    siralama?: string;
  }>;
};

type ListingOwner =
  | { ad_soyad: string | null; email: string | null }
  | { ad_soyad: string | null; email: string | null }[]
  | null
  | undefined;

function ownerDisplayName(owner: ListingOwner) {
  const row = Array.isArray(owner) ? owner[0] : owner;
  return row?.ad_soyad ?? row?.email ?? "-";
}

function parseOptionalNumber(value: string | undefined) {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** RSC → client: yalnızca JSON-güvenli alanlar (BigInt / ekstra view kolonları serileştirmeyi bozmasın). */
function toClientListingRow(row: Record<string, unknown>): ListingTableRow {
  const od = row.onay_durumu;
  const onayDurumu =
    od === "yayinda" || od === "onay_bekliyor" || od === "reddedildi" ? od : null;
  return {
    id: String(row.id ?? ""),
    baslik: String(row.baslik ?? ""),
    konum: String(row.konum ?? ""),
    tip: String(row.tip ?? ""),
    sahip_id: String(row.sahip_id ?? ""),
    gunluk_fiyat: Number(row.gunluk_fiyat ?? 0),
    aktif: Boolean(row.aktif),
    onay_durumu: onayDurumu,
    slug: row.slug != null && row.slug !== "" ? String(row.slug) : null,
    olusturulma_tarihi: String(row.olusturulma_tarihi ?? ""),
    ilan_medyalari: asMediaRows(row.ilan_medyalari),
    aciklama: row.aciklama == null ? null : String(row.aciklama),
  };
}

function asMediaRows(raw: unknown): { id: string; url: string; sira: number }[] {
  if (!Array.isArray(raw)) return [];
  const out: { id: string; url: string; sira: number }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? "");
    const url = String(o.url ?? "");
    const sira = typeof o.sira === "number" ? o.sira : Number(o.sira);
    if (!id || !url) continue;
    out.push({ id, url, sira: Number.isFinite(sira) ? sira : 0 });
  }
  return out;
}

const ILAN_MEDYA_IN_CHUNK = 80;

async function fetchMediaByListingIds(
  supabase: ReturnType<typeof createAdminClient>,
  listingIds: string[],
) {
  const mediaByIlanId = new Map<string, { id: string; url: string; sira: number }[]>();
  if (listingIds.length === 0) return mediaByIlanId;

  try {
    for (let i = 0; i < listingIds.length; i += ILAN_MEDYA_IN_CHUNK) {
      const chunk = listingIds.slice(i, i + ILAN_MEDYA_IN_CHUNK);
      const { data: mediaRows, error: mediaErr } = await supabase
        .from("ilan_medyalari")
        .select("id,ilan_id,url,sira")
        .in("ilan_id", chunk)
        .order("sira", { ascending: true });
      if (mediaErr) {
        console.error("[admin-ilanlar] medya sorgu hatasi:", mediaErr);
        continue;
      }
      for (const m of mediaRows ?? []) {
        const r = m as { ilan_id?: string; id?: string; url?: string; sira?: number | string };
        const ilanId = String(r.ilan_id ?? "");
        if (!ilanId) continue;
        const list = mediaByIlanId.get(ilanId) ?? [];
        const siraNum = typeof r.sira === "number" ? r.sira : Number(r.sira);
        list.push({
          id: String(r.id ?? ""),
          url: String(r.url ?? ""),
          sira: Number.isFinite(siraNum) ? siraNum : 0,
        });
        mediaByIlanId.set(ilanId, list);
      }
    }
  } catch (e) {
    console.error("[admin-ilanlar] medya sorgusu beklenmeyen hata:", e);
  }
  return mediaByIlanId;
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const params = await searchParams;
  const durum = params.durum ?? "";
  const filtre = params.filtre ?? "tumu";
  const q = (params.q ?? "").trim().toLowerCase();
  const minFiyat = parseOptionalNumber(params.min_fiyat);
  const maxFiyat = parseOptionalNumber(params.max_fiyat);
  const supabase = createAdminClient();
  const buildListingsQuery = () => {
    let query = supabase
      .from("admin_ilanlar")
      .select("*");

    if (durum === "onay_bekliyor" || durum === "yayinda" || durum === "reddedildi") {
      query = query.eq("onay_durumu", durum);
    }
    if (minFiyat != null) query = query.gte("gunluk_fiyat", minFiyat);
    if (maxFiyat != null) query = query.lte("gunluk_fiyat", maxFiyat);
    if (params.konum) query = query.eq("konum", params.konum);
    if (params.sahip) query = query.eq("sahip_id", params.sahip);

    if (params.siralama === "eski") {
      query = query.order("olusturulma_tarihi", { ascending: true });
    } else if (params.siralama === "fiyat_artan") {
      query = query.order("gunluk_fiyat", { ascending: true });
    } else if (params.siralama === "fiyat_azalan") {
      query = query.order("gunluk_fiyat", { ascending: false });
    } else {
      query = query.order("olusturulma_tarihi", { ascending: false });
    }

    return query.order("id", { ascending: false });
  };

  const listingsResult = await buildListingsQuery();
  if (listingsResult.error) {
    console.error("[admin-ilanlar] liste sorgu hatasi:", listingsResult.error);
  }

  const [{ data: listings }, { data: users }] = await Promise.all([
    Promise.resolve(listingsResult),
    supabase.from("kullanicilar").select("id,ad_soyad,email"),
  ]);

  const listingRows = listings ?? [];
  const listingIds = [
    ...new Set(listingRows.map((row) => String((row as { id?: unknown }).id ?? "")).filter(Boolean)),
  ];
  const mediaByIlanId = await fetchMediaByListingIds(supabase, listingIds);

  const listingsWithMedia = listingRows.map((row) => {
    const rowId = String((row as { id?: unknown }).id ?? "");
    const fromDb = mediaByIlanId.get(rowId);
    const existing = (row as { ilan_medyalari?: unknown }).ilan_medyalari;
    const merged = fromDb?.length ? fromDb : asMediaRows(existing);
    return {
      ...row,
      ilan_medyalari: merged,
    };
  });

  const userMap = new Map(
    (users ?? []).map((user) => [String(user.id), user.ad_soyad ?? user.email ?? "-"]),
  );
  const locationOptions = [...new Set(listingsWithMedia.map((row) => row.konum).filter(Boolean))].sort();
  const filteredListings = listingsWithMedia.filter((row) => {
    if (filtre === "villa") return row.tip === "villa";
    if (filtre === "tekne") return row.tip === "tekne";
    if (filtre === "aktif") return row.aktif === true;
    if (filtre === "pasif") return row.aktif === false;
    if (!q) return true;
    const owner =
      ownerDisplayName((row as { kullanicilar?: ListingOwner }).kullanicilar) !== "-"
        ? ownerDisplayName((row as { kullanicilar?: ListingOwner }).kullanicilar).toLowerCase()
        : (userMap.get(String(row.sahip_id ?? ""))?.toLowerCase() ?? "");
    return (
      String(row.baslik ?? "").toLowerCase().includes(q) ||
      String(row.konum ?? "").toLowerCase().includes(q) ||
      owner.includes(q) ||
      String(row.id ?? "").toLowerCase().includes(q)
    );
  });
  const aktifCount = filteredListings.filter((row) => row.aktif).length;
  const pasifCount = filteredListings.length - aktifCount;
  const villaCount = filteredListings.filter((row) => row.tip === "villa").length;
  const tekneCount = filteredListings.filter((row) => row.tip === "tekne").length;

  return (
    <AdminPageLayout
      title="İlanlar"
      description="Tüm ilanları durum, tip ve anahtar kelimeye göre yönetebilirsiniz."
      actions={
        <AdminActionButton
          href="/yonetim/ilanlar/yeni"
          variant="primary"
          size="md"
        >
          <Plus className="h-4 w-4" /> Yeni İlan Ekle
        </AdminActionButton>
      }
    >
      <AdminStatsRow
        items={[
          { label: "Toplam", value: filteredListings.length, tone: "default" },
          { label: "Aktif", value: aktifCount, tone: "success" },
          { label: "Pasif", value: pasifCount, tone: "danger" },
          { label: "Villa / Tekne", value: `${villaCount} / ${tekneCount}`, tone: "info" },
        ]}
      />
      <AdminFilterBar className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminFormField label="Arama">
          <AdminInput
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="İlan başlığı, konum, ilan ID, ilan sahibi..."
          />
        </AdminFormField>
        <AdminFormField label="Min fiyat">
          <AdminInput name="min_fiyat" type="number" defaultValue={params.min_fiyat ?? ""} placeholder="₺ min" />
        </AdminFormField>
        <AdminFormField label="Max fiyat">
          <AdminInput name="max_fiyat" type="number" defaultValue={params.max_fiyat ?? ""} placeholder="₺ max" />
        </AdminFormField>
        <AdminFormField label="Bölge / Konum">
          <AdminSelect name="konum" defaultValue={params.konum ?? ""}>
            <option value="">Tüm konumlar</option>
            {locationOptions.map((konum) => (
              <option key={String(konum)} value={String(konum)}>
                {String(konum)}
              </option>
            ))}
          </AdminSelect>
        </AdminFormField>
        <AdminFormField label="İlan sahibi">
          <AdminSelect name="sahip" defaultValue={params.sahip ?? ""}>
            <option value="">Tüm sahipler</option>
            {(users ?? []).map((user) => (
              <option key={String(user.id)} value={String(user.id)}>
                {user.ad_soyad ?? user.email ?? String(user.id)}
              </option>
            ))}
          </AdminSelect>
        </AdminFormField>
        <AdminFormField label="Sıralama">
          <AdminSelect name="siralama" defaultValue={params.siralama ?? "yeni"}>
            <option value="yeni">Ekleniş tarihi (yeni)</option>
            <option value="eski">Ekleniş tarihi (eski)</option>
            <option value="fiyat_artan">Fiyat artan</option>
            <option value="fiyat_azalan">Fiyat azalan</option>
          </AdminSelect>
        </AdminFormField>
        <div className="flex flex-wrap gap-2 xl:col-span-6">
          <AdminActionButton type="submit" variant="primary" size="md">Filtrele</AdminActionButton>
          <AdminActionButton href="/yonetim/ilanlar" variant="secondary" size="md">Temizle</AdminActionButton>
        </div>
      </AdminFilterBar>
      <p className="text-sm text-slate-500">{filteredListings.length} ilan</p>

      <div className="space-y-3">
        <AdminSegmentedTabs
          activeKey={filtre}
          items={[
            { key: "tumu", label: "Tümü", href: "/yonetim/ilanlar?filtre=tumu" },
            { key: "villa", label: "Villa", href: "/yonetim/ilanlar?filtre=villa" },
            { key: "tekne", label: "Tekne", href: "/yonetim/ilanlar?filtre=tekne" },
            { key: "aktif", label: "Aktif", href: "/yonetim/ilanlar?filtre=aktif" },
            { key: "pasif", label: "Pasif", href: "/yonetim/ilanlar?filtre=pasif" },
          ]}
        />
        <AdminSegmentedTabs
          activeKey={durum || "tum_durumlar"}
          items={[
            { key: "tum_durumlar", label: "Tüm Durumlar", href: "/yonetim/ilanlar" },
            { key: "onay_bekliyor", label: "Onay Bekleyen", href: "/yonetim/ilanlar?durum=onay_bekliyor" },
            { key: "yayinda", label: "Yayında", href: "/yonetim/ilanlar?durum=yayinda" },
            { key: "reddedildi", label: "Reddedildi", href: "/yonetim/ilanlar?durum=reddedildi" },
          ]}
        />
      </div>
      {listingsResult.error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          İlanlar listelenirken sorgu hatası oluştu: {listingsResult.error.message}
        </div>
      ) : null}

      <AdminMobileCardList>
        {filteredListings.map((listing) => {
          const row = toClientListingRow(listing as Record<string, unknown>);
          const kapak = listingCoverImageUrl(row.ilan_medyalari);
          return (
            <AdminMobileCard key={row.id}>
              <div className="flex gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-slate-200">
                  {kapak ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={kapak} alt="" className="h-full w-full object-cover" width={48} height={48} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Home className="h-5 w-5 text-slate-500" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{row.baslik}</p>
              <p className="mt-1 text-xs text-slate-500">{row.konum}</p>
              <p className="mt-2 text-sm font-semibold text-[#0e9aa7]">{formatCurrency(Number(row.gunluk_fiyat ?? 0))}</p>
              <div className="mt-3">
                <ListingActions listing={row} />
              </div>
                </div>
              </div>
            </AdminMobileCard>
          );
        })}
      </AdminMobileCardList>
      {filteredListings.length ? (
        <ListingsBulkTable
          listings={filteredListings.map((r) => toClientListingRow(r as Record<string, unknown>))}
        />
      ) : (
        <AdminEmptyState message="Henüz kayıt yok" actionHref="/yonetim/ilanlar/yeni" actionLabel="İlk ilanı ekle →" />
      )}
    </AdminPageLayout>
  );
}
