import {
  deleteAdminPackage,
  updateAdminPackageStatus,
} from "@/app/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import { PackageEditButton } from "./PackageEditButton";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminMobileCard, AdminMobileCardList } from "@/components/admin/AdminMobileCardList";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/AdminDataTable";

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
          { label: "Toplam Fiyat Hacmi", value: formatCurrency(totalRevenue), tone: "info" },
        ]}
      />
      <AdminFilterBar>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Arama</label>
        <input
          name="q"
          defaultValue={resolvedSearchParams?.q ?? ""}
          placeholder="Paket adı, paket ID, kategori..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </AdminFilterBar>
      <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        <a
          href="/yonetim/paketler"
          className={`px-4 py-1.5 text-sm font-medium transition-all ${
            durum === "tumu" ? "rounded-lg bg-white text-slate-800 shadow-sm" : "rounded-lg text-slate-500 hover:text-slate-700"
          }`}
        >
          Tümü
        </a>
        <a
          href="/yonetim/paketler?durum=aktif"
          className={`px-4 py-1.5 text-sm font-medium transition-all ${
            durum === "aktif" ? "rounded-lg bg-white text-slate-800 shadow-sm" : "rounded-lg text-slate-500 hover:text-slate-700"
          }`}
        >
          Aktif Paketler
        </a>
        <a
          href="/yonetim/paketler?durum=pasif"
          className={`px-4 py-1.5 text-sm font-medium transition-all ${
            durum === "pasif" ? "rounded-lg bg-white text-slate-800 shadow-sm" : "rounded-lg text-slate-500 hover:text-slate-700"
          }`}
        >
          Pasif Paketler
        </a>
      </div>

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
      <AdminDataTable minWidthClass="min-w-[720px]">
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>Başlık</AdminTableHeaderCell>
                <AdminTableHeaderCell>Kategori</AdminTableHeaderCell>
                <AdminTableHeaderCell>Fiyat</AdminTableHeaderCell>
                <AdminTableHeaderCell>İlan</AdminTableHeaderCell>
                <AdminTableHeaderCell>Kombinasyon</AdminTableHeaderCell>
                <AdminTableHeaderCell>Görseller</AdminTableHeaderCell>
                <AdminTableHeaderCell>Durum</AdminTableHeaderCell>
                <AdminTableHeaderCell>İşlem</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {filteredPackages.map((row) => {
                const ids = Array.isArray(row.ilan_idleri) ? row.ilan_idleri : [];
                const villaCount = ids.filter((id: string) => listingTypeMap.get(id) === "villa").length;
                const tekneCount = ids.filter((id: string) => listingTypeMap.get(id) === "tekne").length;
                return (
                  <AdminTableRow key={row.id}>
                  <AdminTableCell>{row.baslik}</AdminTableCell>
                  <AdminTableCell>{row.kategori}</AdminTableCell>
                  <AdminTableCell className="font-semibold text-slate-800">{formatCurrency(row.fiyat)}</AdminTableCell>
                  <AdminTableCell>
                    {ids.length}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                      {villaCount} Villa + {tekneCount} Tekne
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    {row.gorsel_url ? (
                      <div className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={row.gorsel_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {ids.slice(0, 3)
                          .map((listingId: string) => (
                            <div key={listingId} className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                              {firstImageMap.get(listingId) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={firstImageMap.get(listingId)} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                          ))}
                      </div>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <form action={updateAdminPackageStatus}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="aktif" value={row.aktif ? "false" : "true"} />
                      <AdminActionButton
                        type="submit"
                        variant={row.aktif ? "danger" : "success"}
                      >
                        {row.aktif ? "Pasife Al" : "Aktif Et"}
                      </AdminActionButton>
                    </form>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <PackageEditButton
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
                      <AdminActionButton
                        href={`/yonetim/paketler/${row.id}/takvim`}
                        variant="secondary"
                      >
                        Müsaitlik Takvimi
                      </AdminActionButton>
                      <form action={deleteAdminPackage}>
                        <input type="hidden" name="id" value={row.id} />
                        <AdminActionButton
                          type="submit"
                          variant="danger"
                        >
                          Sil
                        </AdminActionButton>
                      </form>
                    </div>
                  </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </tbody>
      </AdminDataTable>
      {filteredPackages.length === 0 ? (
        <div className="hidden rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500 lg:block">
          Bu filtrede gösterilecek paket bulunamadı.
        </div>
      ) : null}
    </AdminPageLayout>
  );
}
