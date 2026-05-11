import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import { ListingActions } from "./ListingActions";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminFormField, AdminInput, AdminSelect } from "@/components/admin/AdminFormControls";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminMobileCard, AdminMobileCardList } from "@/components/admin/AdminMobileCardList";
import { AdminSegmentedTabs } from "@/components/admin/AdminSegmentedTabs";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
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

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const params = await searchParams;
  const durum = params.durum ?? "";
  const filtre = params.filtre ?? "tumu";
  const q = (params.q ?? "").trim().toLowerCase();
  const minFiyat = Number(params.min_fiyat ?? "");
  const maxFiyat = Number(params.max_fiyat ?? "");
  const supabase = createAdminClient();
  const buildListingsQuery = () => {
    let query = supabase
      .from("ilanlar")
      .select(
        "id,baslik,konum,tip,sahip_id,gunluk_fiyat,aktif,onay_durumu,slug,olusturulma_tarihi,kullanicilar(ad_soyad,email),ilan_medyalari(id,url,sira)",
      );

    if (durum === "onay_bekliyor" || durum === "yayinda" || durum === "reddedildi") {
      query = query.eq("onay_durumu", durum);
    }
    if (Number.isFinite(minFiyat)) query = query.gte("gunluk_fiyat", minFiyat);
    if (Number.isFinite(maxFiyat)) query = query.lte("gunluk_fiyat", maxFiyat);
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
  const userMap = new Map((users ?? []).map((user) => [user.id, user.ad_soyad ?? user.email ?? "-"]));
  const locationOptions = [...new Set((listings ?? []).map((row) => row.konum).filter(Boolean))].sort();
  const filteredListings = (listings ?? []).filter((row) => {
    if (filtre === "villa") return row.tip === "villa";
    if (filtre === "tekne") return row.tip === "tekne";
    if (filtre === "aktif") return row.aktif === true;
    if (filtre === "pasif") return row.aktif === false;
    if (!q) return true;
    const owner =
      ownerDisplayName((row as { kullanicilar?: ListingOwner }).kullanicilar) !== "-"
        ? ownerDisplayName((row as { kullanicilar?: ListingOwner }).kullanicilar).toLowerCase()
        : (userMap.get(row.sahip_id)?.toLowerCase() ?? "");
    return (
      row.baslik?.toLowerCase().includes(q) ||
      row.konum?.toLowerCase().includes(q) ||
      owner.includes(q) ||
      row.id?.toLowerCase().includes(q)
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
      <AdminFilterBar className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
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
              <option key={konum} value={konum}>{konum}</option>
            ))}
          </AdminSelect>
        </AdminFormField>
        <AdminFormField label="İlan sahibi">
          <AdminSelect name="sahip" defaultValue={params.sahip ?? ""}>
            <option value="">Tüm sahipler</option>
            {(users ?? []).map((user) => (
              <option key={user.id} value={user.id}>{user.ad_soyad ?? user.email ?? user.id}</option>
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
      {listingsResult.error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          İlanlar listelenirken sorgu hatası oluştu: {listingsResult.error.message}
        </div>
      ) : null}

      <AdminMobileCardList>
        {filteredListings.map((listing) => {
          const row = listing as {
            id: string; baslik: string; konum: string; tip: string; gunluk_fiyat: number; aktif: boolean; ilan_medyalari?: { id: string; url: string; sira: number }[] | null;
          };
          return (
            <AdminMobileCard key={row.id}>
              <p className="text-sm font-semibold text-slate-800">{row.baslik}</p>
              <p className="mt-1 text-xs text-slate-500">{row.konum}</p>
              <p className="mt-2 text-sm font-semibold text-[#0e9aa7]">{formatCurrency(Number(row.gunluk_fiyat ?? 0))}</p>
              <div className="mt-3"><ListingActions listing={row as never} /></div>
            </AdminMobileCard>
          );
        })}
      </AdminMobileCardList>
      {filteredListings.length ? (
        <ListingsBulkTable listings={filteredListings as ListingTableRow[]} />
      ) : (
        <AdminEmptyState message="Henüz kayıt yok" actionHref="/yonetim/ilanlar/yeni" actionLabel="İlk ilanı ekle →" />
      )}
    </AdminPageLayout>
  );
}
