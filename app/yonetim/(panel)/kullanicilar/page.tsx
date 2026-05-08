import { updateUserRole } from "@/app/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

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
        <button type="submit" className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
          Ara
        </button>
        <a href="/yonetim/kullanicilar" className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          Temizle
        </a>
      </AdminFilterBar>

      {hasError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          Kullanıcılar yüklenirken bir hata oluştu. Lütfen sunucu loglarını kontrol edin.
        </div>
      ) : null}

      <div className="block space-y-3 lg:hidden">
        {(users ?? []).map((user) => (
          <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">{user.ad_soyad ?? "-"}</p>
            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
            <div className="mt-2"><span className={rolBadge(String(user.rol))}>{user.rol}</span></div>
          </article>
        ))}
      </div>
      <div className="hidden w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Avatar
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ad
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  E-posta
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rol
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Kayıt
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rez.
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  İlan
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user) => {
                const initial = (user.ad_soyad?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
                return (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #0EA5E9, #22C55E)" }}
                      >
                        {initial}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700">{user.ad_soyad ?? "-"}</td>
                    <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">{user.email}</td>
                    <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                      <span className={rolBadge(String(user.rol))}>{user.rol}</span>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">
                      {String(user.olusturulma_tarihi).slice(0, 10)}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">{reservationCountMap.get(user.id) ?? 0}</td>
                    <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">{listingCountMap.get(user.id) ?? 0}</td>
                    <td className="border-b border-slate-100 px-5 py-4 text-sm text-slate-700">
                      <form action={updateUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <select name="rol" defaultValue={user.rol} className="w-32 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                          <option value="ziyaretci">ziyaretci</option>
                          <option value="ilan_sahibi">ilan_sahibi</option>
                          <option value="admin">admin</option>
                        </select>
                        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">
                          ✓ Kaydet
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageLayout>
  );
}
