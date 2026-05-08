"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { updateUserRole, updateUsersRoleBulk } from "@/app/actions/admin";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
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

function rolBadge(rol: string) {
  const base = "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium";
  if (rol === "admin") return `${base} bg-purple-50 text-purple-700 border-purple-200`;
  if (rol === "ilan_sahibi") return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  return `${base} bg-slate-100 text-slate-600 border-slate-200`;
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
          {users.map((user) => {
            const initial = (user.ad_soyad?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
            const duplicateName = user.ad_soyad && duplicateNames.includes(user.ad_soyad.toLocaleLowerCase("tr"));
            return (
              <AdminTableRow key={user.id}>
                <AdminTableCell>
                  <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleOne(user.id)} aria-label={`${user.ad_soyad ?? user.email} seç`} />
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #0EA5E9, #22C55E)" }}>
                    {initial}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <Link href={`/yonetim/kullanicilar/${user.id}`} className="inline-flex items-center gap-1 font-medium text-sky-700 hover:underline">
                    {user.ad_soyad ?? "-"}
                    {duplicateName ? <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Bu isimde başka bir kullanıcı mevcut" /> : null}
                  </Link>
                  {duplicateName ? <p className="text-xs text-amber-600">Bu isimde başka bir kullanıcı mevcut</p> : null}
                </AdminTableCell>
                <AdminTableCell className="text-slate-500">{user.email}</AdminTableCell>
                <AdminTableCell>
                  <span className={rolBadge(String(user.rol))}>{user.rol}</span>
                </AdminTableCell>
                <AdminTableCell className="text-slate-500">
                  {user.olusturulma_tarihi ? new Date(user.olusturulma_tarihi).toLocaleDateString("tr-TR") : "-"}
                </AdminTableCell>
                <AdminTableCell className="text-slate-500">{reservationCountMap[user.id] ?? 0}</AdminTableCell>
                <AdminTableCell className="text-slate-500">{listingCountMap[user.id] ?? 0}</AdminTableCell>
                <AdminTableCell>
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={user.id} />
                    <AdminSelect name="rol" defaultValue={user.rol ?? "ziyaretci"} className="w-32">
                      <option value="ziyaretci">ziyaretci</option>
                      <option value="ilan_sahibi">ilan_sahibi</option>
                      <option value="admin">admin</option>
                    </AdminSelect>
                    <AdminActionButton type="submit" variant="success">✓ Kaydet</AdminActionButton>
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
            <AdminActionButton
              href={`mailto:${selectedEmails.join(",")}`}
              variant="secondary"
            >
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
