import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";
import { Home, Plus } from "lucide-react";
import { ListingActions } from "./ListingActions";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminMobileCard, AdminMobileCardList } from "@/components/admin/AdminMobileCardList";
import { AdminSegmentedTabs } from "@/components/admin/AdminSegmentedTabs";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/AdminDataTable";
import { AdminActionButton } from "@/components/admin/AdminActionButton";

type AdminListingsPageProps = {
  searchParams: Promise<{ durum?: string; filtre?: string; q?: string }>;
};

function ilkResim(medyalar: { id?: string; url: string; sira: number }[] | null | undefined) {
  if (!medyalar?.length) return null;
  return [...medyalar].sort((a, b) => a.sira - b.sira)[0]?.url ?? null;
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const params = await searchParams;
  const durum = params.durum ?? "";
  const filtre = params.filtre ?? "tumu";
  const q = (params.q ?? "").trim().toLowerCase();
  const supabase = await createClient();
  let query = supabase
    .from("ilanlar")
    .select("*, ilan_medyalari(id,url,sira)")
    .order("olusturulma_tarihi", { ascending: false })
    .order("id", { ascending: false });
  if (durum === "bekleyen" || durum === "reddedildi") query = query.eq("aktif", false);
  if (durum === "yayinda") query = query.eq("aktif", true);

  const [{ data: listings }, { data: users }] = await Promise.all([
    query,
    supabase.from("kullanicilar").select("id,ad_soyad,email"),
  ]);
  const userMap = new Map(
    (users ?? []).map((user) => [user.id, user.ad_soyad ?? user.email ?? "-"]),
  );
  const filteredListings = (listings ?? []).filter((row) => {
    if (filtre === "villa") return row.tip === "villa";
    if (filtre === "tekne") return row.tip === "tekne";
    if (filtre === "aktif") return row.aktif === true;
    if (filtre === "pasif") return row.aktif === false;
    if (!q) return true;
    const owner = userMap.get(row.sahip_id)?.toLowerCase() ?? "";
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
      <AdminFilterBar>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Arama</label>
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="İlan başlığı, konum, ilan ID, ilan sahibi..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
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
          { key: "bekleyen", label: "Onay Bekleyen", href: "/yonetim/ilanlar?durum=bekleyen" },
          { key: "yayinda", label: "Yayında", href: "/yonetim/ilanlar?durum=yayinda" },
          { key: "reddedildi", label: "Reddedildi", href: "/yonetim/ilanlar?durum=reddedildi" },
        ]}
      />

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
      <AdminDataTable minWidthClass="min-w-[900px]">
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>İlan</AdminTableHeaderCell>
                <AdminTableHeaderCell>Tip</AdminTableHeaderCell>
                <AdminTableHeaderCell>Fiyat</AdminTableHeaderCell>
                <AdminTableHeaderCell>Durum</AdminTableHeaderCell>
                <AdminTableHeaderCell align="right">İşlemler</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {filteredListings.map((listing) => {
                const row = listing as {
                  id: string;
                  baslik: string;
                  konum: string;
                  tip: string;
                  sahip_id: string;
                  gunluk_fiyat: number;
                  aktif: boolean;
                  slug?: string;
                  olusturulma_tarihi: string;
                  ilan_medyalari?: { id: string; url: string; sira: number }[] | null;
                };
                const url = ilkResim(row.ilan_medyalari);
                return (
                  <AdminTableRow key={row.id}>
                    <AdminTableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Home className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="line-clamp-1 text-sm font-semibold text-slate-800">{row.baslik}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{row.konum}</p>
                        </div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-600">
                        {row.tip}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="font-semibold text-slate-800">{formatCurrency(Number(row.gunluk_fiyat ?? 0))}</span>
                      <span className="text-xs text-slate-500"> /gece</span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${row.aktif ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
                        {row.aktif ? "Yayında" : "Pasif"}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <ListingActions listing={row} />
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </tbody>
      </AdminDataTable>
    </AdminPageLayout>
  );
}
