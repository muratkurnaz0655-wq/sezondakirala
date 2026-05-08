import { updateUserRole } from "@/app/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
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

type AdminUsersPageProps = {
  searchParams: Promise<{ q?: string; siralama?: string }>;
};

function rolBadge(rol: string) {
  const base = "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium";
  if (rol === "admin") return `${base} bg-purple-50 text-purple-700 border-purple-200`;
  if (rol === "ilan_sahibi") return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  return `${base} bg-slate-100 text-slate-600 border-slate-200`;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const sortAsc = params.siralama === "eski";
  const supabase = createAdminClient();

  let userQuery = supabase.from("kullanicilar").select("*").order("olusturulma_tarihi", { ascending: sortAsc });
  if (q) {
    const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    userQuery = userQuery.or(`email.ilike.%${escaped}%,ad_soyad.ilike.%${escaped}%,id.ilike.%${escaped}%`);
  }

  const [
    { data: users, error: usersError },
    { data: reservations, error: reservationsError },
    { data: listings, error: listingsError },
  ] = await Promise.all([
    userQuery,
    supabase.from("rezervasyonlar").select("id,kullanici_id"),
    supabase.from("ilanlar").select("id,sahip_id"),
  ]);
  const hasError = usersError || reservationsError || listingsError;

  const reservationCountMap = new Map<string, number>();
  (reservations ?? []).forEach((row) =>
    reservationCountMap.set(row.kullanici_id, (reservationCountMap.get(row.kullanici_id) ?? 0) + 1),
  );
  const listingCountMap = new Map<string, number>();
  (listings ?? []).forEach((row) =>
    listingCountMap.set(row.sahip_id, (listingCountMap.get(row.sahip_id) ?? 0) + 1),
  );
  const totalUsers = (users ?? []).length;
  const adminCount = (users ?? []).filter((u) => u.rol === "admin").length;
  const ownerCount = (users ?? []).filter((u) => u.rol === "ilan_sahibi").length;
  const visitorCount = totalUsers - adminCount - ownerCount;

  return (
    <AdminPageLayout
      title="Kullanıcılar"
      description="Kullanıcı rolleri, rezervasyon adetleri ve ilan sahipliklerini yönetin."
    >
      <AdminStatsRow
        items={[
          { label: "Toplam", value: totalUsers, tone: "default" },
          { label: "Admin", value: adminCount, tone: "purple" },
          { label: "İlan Sahibi", value: ownerCount, tone: "info" },
          { label: "Ziyaretçi", value: visitorCount, tone: "warning" },
        ]}
      />

      <AdminFilterBar className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-end" method="get">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Ara</label>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="E-posta veya ad soyad"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Sıralama</label>
          <select
            name="siralama"
            defaultValue={params.siralama ?? "yeni"}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="yeni">Yeni → Eski</option>
            <option value="eski">Eski → Yeni</option>
          </select>
        </div>
        <AdminActionButton type="submit" variant="primary" size="md" className="w-full sm:w-auto shrink-0">
          Ara
        </AdminActionButton>
        <AdminActionButton href="/yonetim/kullanicilar" variant="secondary" size="md" className="w-full sm:w-auto shrink-0">
          Temizle
        </AdminActionButton>
      </AdminFilterBar>

      {hasError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          Kullanıcılar yüklenirken bir hata oluştu. Lütfen sunucu loglarını kontrol edin.
        </div>
      ) : null}

      <AdminMobileCardList>
        {(users ?? []).map((user) => (
          <AdminMobileCard key={user.id}>
            <p className="text-sm font-semibold text-slate-800">{user.ad_soyad ?? "-"}</p>
            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
            <div className="mt-2"><span className={rolBadge(String(user.rol))}>{user.rol}</span></div>
          </AdminMobileCard>
        ))}
      </AdminMobileCardList>
      <AdminDataTable>
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>Avatar</AdminTableHeaderCell>
                <AdminTableHeaderCell>Ad</AdminTableHeaderCell>
                <AdminTableHeaderCell>E-posta</AdminTableHeaderCell>
                <AdminTableHeaderCell>Rol</AdminTableHeaderCell>
                <AdminTableHeaderCell>Kayıt</AdminTableHeaderCell>
                <AdminTableHeaderCell>Rez.</AdminTableHeaderCell>
                <AdminTableHeaderCell>İlan</AdminTableHeaderCell>
                <AdminTableHeaderCell>İşlem</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {(users ?? []).map((user) => {
                const initial = (user.ad_soyad?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
                return (
                  <AdminTableRow key={user.id}>
                    <AdminTableCell>
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #0EA5E9, #22C55E)" }}
                      >
                        {initial}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>{user.ad_soyad ?? "-"}</AdminTableCell>
                    <AdminTableCell className="text-slate-500">{user.email}</AdminTableCell>
                    <AdminTableCell>
                      <span className={rolBadge(String(user.rol))}>{user.rol}</span>
                    </AdminTableCell>
                    <AdminTableCell className="text-slate-500">
                      {String(user.olusturulma_tarihi).slice(0, 10)}
                    </AdminTableCell>
                    <AdminTableCell className="text-slate-500">{reservationCountMap.get(user.id) ?? 0}</AdminTableCell>
                    <AdminTableCell className="text-slate-500">{listingCountMap.get(user.id) ?? 0}</AdminTableCell>
                    <AdminTableCell>
                      <form action={updateUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <select name="rol" defaultValue={user.rol} className="w-32 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                          <option value="ziyaretci">ziyaretci</option>
                          <option value="ilan_sahibi">ilan_sahibi</option>
                          <option value="admin">admin</option>
                        </select>
                        <AdminActionButton type="submit" variant="success">
                          ✓ Kaydet
                        </AdminActionButton>
                      </form>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </tbody>
      </AdminDataTable>
    </AdminPageLayout>
  );
}
