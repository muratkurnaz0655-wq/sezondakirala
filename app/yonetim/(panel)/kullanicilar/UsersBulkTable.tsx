"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { updateUserRole, updateUsersRoleBulk } from "@/app/actions/admin";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminBadge, type AdminBadgeVariant } from "@/components/admin/AdminBadge";
import { AdminSelect } from "@/components/admin/AdminFormControls";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/AdminDataTable";

export type UserTableRow = {
  id: string;
  ad_soyad: string | null;
  email: string | null;
  telefon?: string | null;
  rol: string | null;
  olusturulma_tarihi: string | null;
  hesap_durumu?: string | null;
};

function userRolBadgeVariant(rol: string): AdminBadgeVariant {
  if (rol === "admin") return "purple";
  if (rol === "ilan_sahibi") return "blue";
  return "neutral";
}

function avatarBackground(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 52% 46%)`;
}

export function UsersBulkTable({
  users,
  reservationCountMap,
  listingCountMap,
  duplicateNames,
}: {
  users: UserTableRow[];
  reservationCountMap: Record<string, number>;
  listingCountMap: Record<string, number>;
  duplicateNames: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState("ziyaretci");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const allSelected = users.length > 0 && selectedIds.length === users.length;
  const selectedEmails = useMemo(
    () => users.filter((user) => selectedIds.includes(user.id)).map((user) => user.email).filter(Boolean) as string[],
    [selectedIds, users],
  );

  function toggleAll() {
    setSelectedIds(allSelected ? [] : users.map((user) => user.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function applyBulkRole() {
    setNotice(null);
    startTransition(async () => {
      const result = await updateUsersRoleBulk(selectedIds, bulkRole);
      setNotice(result.success ? "Toplu rol değiştirildi." : result.error);
      if (result.success) setSelectedIds([]);
    });
  }

  return (
    <div className="space-y-3">
      <AdminDataTable>
        <AdminTableHead>
          <tr>
            <AdminTableHeaderCell>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Tümünü seç" />
            </AdminTableHeaderCell>
            <AdminTableHeaderCell>Avatar</AdminTableHeaderCell>
            <AdminTableHeaderCell>Kullanıcı</AdminTableHeaderCell>
            <AdminTableHeaderCell>Rol</AdminTableHeaderCell>
            <AdminTableHeaderCell>Kayıt</AdminTableHeaderCell>
            <AdminTableHeaderCell className="text-right">Rez.</AdminTableHeaderCell>
            <AdminTableHeaderCell className="text-right">İlan</AdminTableHeaderCell>
            <AdminTableHeaderCell>İşlem</AdminTableHeaderCell>
          </tr>
        </AdminTableHead>
        <tbody>
          {users.map((user) => {
            const initial = (user.ad_soyad?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
            const nameKey = user.ad_soyad?.trim().toLocaleLowerCase("tr") ?? "";
            const duplicateName = Boolean(nameKey) && duplicateNames.includes(nameKey);
            const rez = reservationCountMap[user.id] ?? 0;
            const ilan = listingCountMap[user.id] ?? 0;
            const kayit = user.olusturulma_tarihi
              ? new Date(user.olusturulma_tarihi).toLocaleDateString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "-";
            return (
              <AdminTableRow key={user.id}>
                <AdminTableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleOne(user.id)}
                    aria-label={`${user.ad_soyad ?? user.email} seç`}
                  />
                </AdminTableCell>
                <AdminTableCell>
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: avatarBackground(user.id) }}
                  >
                    {initial}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex min-w-0 items-start gap-1.5">
                    <Link
                      href={`/yonetim/kullanicilar/${user.id}`}
                      className="min-w-0 font-semibold text-[#1E293B] hover:underline"
                    >
                      {user.ad_soyad ?? "-"}
                    </Link>
                    {duplicateName ? (
                      <span className="inline-flex shrink-0" title="Bu isimde başka kullanıcı var">
                        <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">{user.email ?? "-"}</p>
                  <p className="text-[11px] text-[#94A3B8]">{user.telefon?.trim() ? user.telefon : "—"}</p>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge variant={userRolBadgeVariant(String(user.rol))}>{user.rol}</AdminBadge>
                </AdminTableCell>
                <AdminTableCell className="text-[#64748B]">{kayit}</AdminTableCell>
                <AdminTableCell className={`text-right tabular-nums ${rez === 0 ? "text-[#94A3B8]" : "font-medium text-[#1E293B]"}`}>
                  {rez}
                </AdminTableCell>
                <AdminTableCell className={`text-right tabular-nums ${ilan === 0 ? "text-[#94A3B8]" : "font-medium text-[#1E293B]"}`}>
                  {ilan}
                </AdminTableCell>
                <AdminTableCell>
                  <form action={updateUserRole} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={user.id} />
                    <AdminSelect name="rol" defaultValue={user.rol ?? "ziyaretci"} className="min-w-[7.5rem] max-w-[10rem]">
                      <option value="ziyaretci">ziyaretci</option>
                      <option value="ilan_sahibi">ilan_sahibi</option>
                      <option value="admin">admin</option>
                    </AdminSelect>
                    <AdminActionButton
                      type="submit"
                      variant="success"
                      size="sm"
                      title="Kaydet"
                      className="h-8 w-8 shrink-0 gap-0 p-0"
                    >
                      <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                      <span className="sr-only">Kaydet</span>
                    </AdminActionButton>
                  </form>
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </tbody>
      </AdminDataTable>

      {selectedIds.length > 0 ? (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
          <span className="text-sm font-semibold text-slate-700">{selectedIds.length} kullanıcı seçildi</span>
          <div className="flex flex-wrap items-center gap-2">
            <AdminActionButton href={`mailto:${selectedEmails.join(",")}`} variant="secondary">
              Seçilenlere E-posta Gönder
            </AdminActionButton>
            <AdminSelect value={bulkRole} onChange={(event) => setBulkRole(event.target.value)} className="w-36">
              <option value="ziyaretci">ziyaretci</option>
              <option value="ilan_sahibi">ilan_sahibi</option>
              <option value="admin">admin</option>
            </AdminSelect>
            <AdminActionButton type="button" variant="primary" disabled={isPending} onClick={applyBulkRole}>
              Rolü Değiştir
            </AdminActionButton>
          </div>
          {notice ? <p className="w-full text-xs text-slate-500">{notice}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
