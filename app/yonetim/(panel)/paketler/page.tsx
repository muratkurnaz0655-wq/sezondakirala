import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { CalendarDays, Plus } from "lucide-react";
import { PackageEditButton } from "./PackageEditButton";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminFormField, AdminInput } from "@/components/admin/AdminFormControls";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminMobileCard, AdminMobileCardList } from "@/components/admin/AdminMobileCardList";
import { AdminSegmentedTabs } from "@/components/admin/AdminSegmentedTabs";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/AdminDataTable";
import { PackageDeleteButton, PackageStatusToggle } from "./PackageRowActions";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminBadge, adminPackageCategoryVariant } from "@/components/admin/AdminBadge";

const calendarIconBtn =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border-[0.5px] border-[#7C3AED]/55 text-[#7C3AED] transition-colors hover:bg-[#7C3AED]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

type AdminPackagesPageProps = {
  searchParams?: Promise<{ durum?: string; q?: string }>;
};

export default async function AdminPackagesPage({ searchParams }: AdminPackagesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const durumRaw = resolvedSearchParams?.durum;
  const durum = durumRaw === "aktif" || durumRaw === "pasif" ? durumRaw : "tumu";
  const q = (resolvedSearchParams?.q ?? "").trim().toLowerCase();
  const supabase = createAdminClient();
  const buildPackageBaseQuery = () =>
    durum === "aktif"
      ? supabase.from("paketler").select("*").eq("aktif", true)
      : durum === "pasif"
        ? supabase.from("paketler").select("*").eq("aktif", false)
        : supabase.from("paketler").select("*");

  // Bazı ortamlarda `olusturulma_tarihi` kolonu olmayabiliyor; bu durumda fallback ile yine listele.
  let packagesResult = await buildPackageBaseQuery()
    .order("olusturulma_tarihi", { ascending: false })
    .order("id", { ascending: false });
  if (packagesResult.error) {
    packagesResult = await buildPackageBaseQuery().order("id", { ascending: false });
  }

  const [{ data: listings }, { data: packageMedias }] = await Promise.all([
    supabase
      .from("ilanlar")
      .select("id,baslik,tip,ilan_medyalari(url,sira)")
      .order("olusturulma_tarihi", { ascending: false }),
    supabase.from("paket_medyalari").select("id,paket_id,url,tip,sira"),
  ]);
  const packages = packagesResult.data ?? [];
  const filteredPackages = packages.filter((row) => {
    if (!q) return true;
    return (
      row.baslik?.toLowerCase().includes(q) ||
      row.id?.toLowerCase().includes(q) ||
      row.kategori?.toLowerCase().includes(q)
    );
  });
  const aktifCount = filteredPackages.filter((p) => p.aktif).length;
  const pasifCount = filteredPackages.length - aktifCount;
  const totalRevenue = filteredPackages.reduce((sum, p) => sum + Number(p.fiyat ?? 0), 0);
  const firstImageMap = new Map<string, string>();
  (listings ?? []).forEach((listing) => {
    const media = (listing.ilan_medyalari ?? []) as { url: string; sira: number }[];
    const first = [...media].sort((a, b) => a.sira - b.sira)[0]?.url;
    if (first) firstImageMap.set(listing.id, first);
  });
  const listingTypeMap = new Map<string, string>();
  (listings ?? []).forEach((listing) => {
    listingTypeMap.set(listing.id, listing.tip ?? "villa");
  });
  const packageMediaMap = new Map<string, { id: string; url: string; tip: string; sira: number }[]>();
  (packageMedias ?? []).forEach((media) => {
    const current = packageMediaMap.get(media.paket_id) ?? [];
    current.push(media);
    packageMediaMap.set(media.paket_id, current);
  });
  const packageKapakMap = new Map<string, string>();
  packageMediaMap.forEach((medias, pid) => {
    const kapak = [...medias]
      .filter((m) => m.tip === "kapak" && m.url)
      .sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0))[0];
    if (kapak?.url) packageKapakMap.set(pid, kapak.url);
  });

  function packageThumbnailUrl(row: (typeof filteredPackages)[number]): string | null {
    if (row.gorsel_url) return row.gorsel_url;
    const fromKapak = packageKapakMap.get(row.id);
    if (fromKapak) return fromKapak;
    const ids = Array.isArray(row.ilan_idleri) ? row.ilan_idleri : [];
    for (const lid of ids) {
      const u = firstImageMap.get(lid);
      if (u) return u;
    }
    return null;
  }

  const temizleHref = durum === "tumu" ? "/yonetim/paketler" : `/yonetim/paketler?durum=${durum}`;

  return (
    <AdminPageLayout
      title="Paketler"
      description="Paket içeriklerini, durumlarını ve takvimlerini merkezi olarak yönetin."
      actions={
        <AdminActionButton
          href="/yonetim/paketler/yeni"
          variant="primary"
          size="md"
        >
          <Plus className="h-4 w-4" /> Yeni Paket Ekle
        </AdminActionButton>
      }
    >
      <AdminStatsRow
        items={[
          { label: "Toplam Paket", value: filteredPackages.length, tone: "default" },
          { label: "Aktif / Pasif", value: `${aktifCount} / ${pasifCount}`, tone: "success" },
          { label: "Toplam Fiyat Hacmi", value: formatCurrency(totalRevenue), tone: "purple" },
        ]}
      />
      <AdminFilterBar className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        {durum !== "tumu" ? <input type="hidden" name="durum" value={durum} /> : null}
        <div className="min-w-0 flex-1 lg:max-w-md">
          <AdminFormField label="Arama">
            <AdminInput
              name="q"
              defaultValue={resolvedSearchParams?.q ?? ""}
              placeholder="Paket adı, paket ID, kategori..."
            />
          </AdminFormField>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminActionButton type="submit" variant="primary" size="md" className="w-full sm:w-auto">
            Filtrele
          </AdminActionButton>
          <AdminActionButton href={temizleHref} variant="secondary" size="md" className="w-full sm:w-auto">
            Temizle
          </AdminActionButton>
        </div>
      </AdminFilterBar>
      <AdminSegmentedTabs
        className="mb-4"
        activeKey={durum}
        items={[
          { key: "tumu", label: "Tümü", href: "/yonetim/paketler" },
          { key: "aktif", label: "Aktif Paketler", href: "/yonetim/paketler?durum=aktif" },
          { key: "pasif", label: "Pasif Paketler", href: "/yonetim/paketler?durum=pasif" },
        ]}
      />

      {packagesResult.error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Paketler listelenirken bir sorgu hatası oluştu: {packagesResult.error.message}
        </div>
      ) : null}

      <AdminMobileCardList>
        {filteredPackages.map((row) => (
          <AdminMobileCard key={row.id}>
            <p className="text-sm font-semibold text-slate-800">{row.baslik}</p>
            <p className="mt-1 text-xs text-slate-500">{row.kategori}</p>
            <p className="mt-2 text-sm font-semibold text-[#0e9aa7]">{formatCurrency(row.fiyat)}</p>
            <div className="mt-3">
              <PackageEditButton
                pkg={{ ...row, paket_medyalari: packageMediaMap.get(row.id) ?? [] }}
                listings={(listings ?? []).map((listing) => ({
                  id: listing.id,
                  baslik: listing.baslik,
                  tip: listing.tip ?? "villa",
                  imageUrl: firstImageMap.get(listing.id) ?? null,
                }))}
              />
            </div>
          </AdminMobileCard>
        ))}
      </AdminMobileCardList>
      <AdminDataTable minWidthClass="min-w-[900px]">
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>Başlık</AdminTableHeaderCell>
                <AdminTableHeaderCell>Görsel</AdminTableHeaderCell>
                <AdminTableHeaderCell>Fiyat</AdminTableHeaderCell>
                <AdminTableHeaderCell>İlan</AdminTableHeaderCell>
                <AdminTableHeaderCell>Kombinasyon</AdminTableHeaderCell>
                <AdminTableHeaderCell>Durum</AdminTableHeaderCell>
                <AdminTableHeaderCell>İşlem</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {filteredPackages.map((row) => {
                const ids = Array.isArray(row.ilan_idleri) ? row.ilan_idleri : [];
                const villaCount = ids.filter((id: string) => listingTypeMap.get(id) === "villa").length;
                const tekneCount = ids.filter((id: string) => listingTypeMap.get(id) === "tekne").length;
                const thumb = packageThumbnailUrl(row);
                return (
                  <AdminTableRow key={row.id}>
                  <AdminTableCell>
                    <p className="font-semibold text-[#1E293B]">{row.baslik}</p>
                    <div className="mt-1.5">
                      <AdminBadge variant={adminPackageCategoryVariant(row.kategori)}>
                        {row.kategori ?? "—"}
                      </AdminBadge>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {thumb ? (
                      <div className="h-11 w-11 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F1F5F9]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] text-[10px] font-medium text-[#94A3B8]"
                        title="Görsel yok"
                      >
                        —
                      </div>
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="text-right font-semibold text-[#1E293B]">{formatCurrency(row.fiyat)}</AdminTableCell>
                  <AdminTableCell className="tabular-nums text-[#1E293B]">{ids.length}</AdminTableCell>
                  <AdminTableCell>
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
                        {villaCount} villa
                      </span>
                      <span className="inline-flex rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
                        {tekneCount} tekne
                      </span>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <PackageStatusToggle id={row.id} active={Boolean(row.aktif)} title={row.baslik ?? ""} />
                      <span className="text-xs font-medium text-[#64748B]">{row.aktif ? "Aktif" : "Pasif"}</span>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <PackageEditButton
                        iconOnly
                        pkg={{
                          ...row,
                          paket_medyalari: packageMediaMap.get(row.id) ?? [],
                        }}
                        listings={(listings ?? []).map((listing) => ({
                          id: listing.id,
                          baslik: listing.baslik,
                          tip: listing.tip ?? "villa",
                          imageUrl: firstImageMap.get(listing.id) ?? null,
                        }))}
                      />
                      <Link
                        href={`/yonetim/paketler/${row.id}/takvim`}
                        title="Müsaitlik"
                        aria-label="Müsaitlik takvimi"
                        className={calendarIconBtn}
                      >
                        <CalendarDays className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </Link>
                      <PackageDeleteButton id={row.id} title={row.baslik ?? ""} iconOnly />
                    </div>
                  </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </tbody>
      </AdminDataTable>
      {filteredPackages.length === 0 ? (
        <AdminEmptyState message="Henüz kayıt yok" actionHref="/yonetim/paketler/yeni" actionLabel="İlk paketi ekle →" className="hidden lg:block" />
      ) : null}
    </AdminPageLayout>
  );
}
