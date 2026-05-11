import { createAdminClient } from "@/lib/supabase/admin";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminFormField, AdminInput, AdminSelect } from "@/components/admin/AdminFormControls";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminMobileCard, AdminMobileCardList } from "@/components/admin/AdminMobileCardList";
import { UsersBulkTable, type UserTableRow } from "./UsersBulkTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminBadge, type AdminBadgeVariant } from "@/components/admin/AdminBadge";

type AdminUsersPageProps = {
  searchParams: Promise<{ q?: string; siralama?: string }>;
};

function userRolBadgeVariant(rol: string): AdminBadgeVariant {
  if (rol === "admin") return "purple";
  if (rol === "ilan_sahibi") return "blue";
  return "neutral";
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
  const duplicateNames = [...(users ?? []).reduce((map, user) => {
    const key = user.ad_soyad?.trim().toLocaleLowerCase("tr");
    if (key) map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map<string, number>())]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
  const reservationCounts = Object.fromEntries(reservationCountMap);
  const listingCounts = Object.fromEntries(listingCountMap);

  return (
    <AdminPageLayout
      title="Kullanıcılar"
      description="Kullanıcı rolleri, rezervasyon adetleri ve ilan sahipliklerini yönetin."
    >
      <AdminStatsRow
        items={[
          { label: "Toplam", value: totalUsers, tone: "default" },
          { label: "Admin", value: adminCount, tone: "purple" },
          { label: "İlan Sahibi", value: ownerCount, tone: "success" },
          { label: "Ziyaretçi", value: visitorCount, tone: "warning" },
        ]}
      />

      <AdminFilterBar className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end" method="get">
        <div className="min-w-0 flex-1">
          <AdminFormField label="Ara">
            <AdminInput
              name="q"
              type="search"
              defaultValue={q}
              placeholder="E-posta veya ad soyad"
            />
          </AdminFormField>
        </div>
        <AdminFormField label="Sıralama">
          <AdminSelect
            name="siralama"
            defaultValue={params.siralama ?? "yeni"}
          >
            <option value="yeni">Yeni → Eski</option>
            <option value="eski">Eski → Yeni</option>
          </AdminSelect>
        </AdminFormField>
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
            <div className="mt-2">
              <AdminBadge variant={userRolBadgeVariant(String(user.rol))}>{user.rol}</AdminBadge>
            </div>
          </AdminMobileCard>
        ))}
      </AdminMobileCardList>
      {(users ?? []).length ? (
        <UsersBulkTable
          users={(users ?? []) as UserTableRow[]}
          reservationCountMap={reservationCounts}
          listingCountMap={listingCounts}
          duplicateNames={duplicateNames}
        />
      ) : (
        <AdminEmptyState message="Henüz kayıt yok" actionHref="/kayit" actionLabel="İlk kullanıcıyı ekle →" />
      )}
    </AdminPageLayout>
  );
}
