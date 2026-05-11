"use client";

import { useState } from "react";
import { Bell, Globe, History } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminBadge, type AdminBadgeVariant } from "@/components/admin/AdminBadge";
import { AdminFormField, AdminInput } from "@/components/admin/AdminFormControls";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
} from "@/components/admin/AdminDataTable";
import { AyarlarForm, type AyarlarFormMevcut } from "./AyarlarForm";
import { bildirimTercihleriniKaydet, topluBildirimGonder } from "./actions";

type LogRow = {
  id: string;
  olusturulma_tarihi: string;
  kullanici_email: string | null;
  islem: string;
  entity_tip: string | null;
  entity_baslik: string | null;
};

function adminLogBadgeVariant(islem: string): AdminBadgeVariant {
  switch (islem) {
    case "ilan_eklendi":
      return "success";
    case "ilan_silindi":
    case "rezervasyon_iptal":
      return "danger";
    case "ilan_pasife_alindi":
      return "warning";
    case "rezervasyon_onaylandi":
      return "info";
    case "kullanici_rol_degistirdi":
      return "purple";
    default:
      return "neutral";
  }
}

const bildirimSatirlari: {
  key: "yeni_rezervasyonda_bildir" | "yeni_kullanicida_bildir" | "beklemede_24saat_bildir" | "iptal_edildiginde_bildir";
  baslik: string;
  aciklama: string;
}[] = [
  {
    key: "yeni_rezervasyonda_bildir",
    baslik: "Yeni rezervasyonda bildir",
    aciklama: "Yeni bir rezervasyon oluştuğunda yönetici bildirimi alırsınız.",
  },
  {
    key: "yeni_kullanicida_bildir",
    baslik: "Yeni kullanıcı kaydında bildir",
    aciklama: "Siteye yeni kullanıcı kaydı geldiğinde haberdar olun.",
  },
  {
    key: "beklemede_24saat_bildir",
    baslik: "24 saat beklemedeki rezervasyonlarda uyar",
    aciklama: "Uzun süre onay bekleyen rezervasyonlar için uyarı.",
  },
  {
    key: "iptal_edildiginde_bildir",
    baslik: "İptal edildiğinde bildir",
    aciklama: "Rezervasyon iptallerinde bildirim gönderilir.",
  },
];

export function AyarlarTabs({
  mevcutAyarlar,
  logs,
  preferences,
}: {
  mevcutAyarlar: AyarlarFormMevcut;
  logs: LogRow[];
  preferences: {
    id: string;
    yeni_rezervasyonda_bildir: boolean;
    yeni_kullanicida_bildir: boolean;
    beklemede_24saat_bildir: boolean;
    iptal_edildiginde_bildir: boolean;
  } | null;
}) {
  const [activeTab, setActiveTab] = useState<"genel" | "log" | "bildirim">("genel");
  const [localPreferences, setLocalPreferences] = useState({
    id: preferences?.id ?? "",
    yeni_rezervasyonda_bildir: preferences?.yeni_rezervasyonda_bildir ?? true,
    yeni_kullanicida_bildir: preferences?.yeni_kullanicida_bildir ?? true,
    beklemede_24saat_bildir: preferences?.beklemede_24saat_bildir ?? true,
    iptal_edildiginde_bildir: preferences?.iptal_edildiginde_bildir ?? true,
  });

  const tabs: { id: typeof activeTab; label: string; icon: typeof Globe }[] = [
    { id: "genel", label: "Genel Ayarlar", icon: Globe },
    { id: "log", label: "İşlem Geçmişi", icon: History },
    { id: "bildirim", label: "Bildirim Tercihleri", icon: Bell },
  ];

  return (
    <section className="w-full max-w-5xl overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div
        role="tablist"
        aria-label="Ayarlar sekmeleri"
        className="flex flex-wrap gap-0 rounded-t-xl border-b border-[#E2E8F0] bg-white px-1 pt-1"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm transition-colors duration-150 ${
                active
                  ? "border-b-2 border-[#185FA5] bg-white font-medium text-[#185FA5]"
                  : "border-b-2 border-transparent font-normal text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-5 md:p-6">
        {activeTab === "genel" ? <AyarlarForm mevcutAyarlar={mevcutAyarlar} /> : null}

        {activeTab === "log" ? (
          <AdminDataTable minWidthClass="min-w-[720px]">
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>Tarih</AdminTableHeaderCell>
                <AdminTableHeaderCell>Kullanıcı</AdminTableHeaderCell>
                <AdminTableHeaderCell>İşlem</AdminTableHeaderCell>
                <AdminTableHeaderCell>Etkilenen</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {logs.length ? (
                logs.map((log) => (
                  <AdminTableRow key={log.id}>
                    <AdminTableCell className="whitespace-nowrap text-[#64748B]">
                      {new Date(log.olusturulma_tarihi).toLocaleString("tr-TR")}
                    </AdminTableCell>
                    <AdminTableCell className="text-[#1E293B]">{log.kullanici_email ?? "-"}</AdminTableCell>
                    <AdminTableCell>
                      <AdminBadge variant={adminLogBadgeVariant(log.islem)}>{log.islem}</AdminBadge>
                    </AdminTableCell>
                    <AdminTableCell className="text-[#64748B]">{log.entity_baslik ?? log.entity_tip ?? "-"}</AdminTableCell>
                  </AdminTableRow>
                ))
              ) : (
                <AdminTableRow>
                  <AdminTableCell colSpan={4} className="py-10 text-center text-[#64748B]">
                    Henüz kayıt yok
                  </AdminTableCell>
                </AdminTableRow>
              )}
            </tbody>
          </AdminDataTable>
        ) : null}

        {activeTab === "bildirim" ? (
          <div className="space-y-8">
            <form action={topluBildirimGonder} className="space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/40 p-5">
              <h3 className="text-sm font-semibold text-[#1E293B]">Tüm Kullanıcılara Duyuru Gönder</h3>
              <AdminFormField label="Başlık">
                <AdminInput name="baslik" required placeholder="Bildirim başlığı" />
              </AdminFormField>
              <AdminFormField label="Mesaj">
                <textarea
                  name="mesaj"
                  required
                  rows={4}
                  placeholder="Kullanıcıların göreceği duyuru metni..."
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#1E293B] transition-all placeholder:text-[#94A3B8] focus:border-[#185FA5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20"
                />
              </AdminFormField>
              <AdminActionButton type="submit" variant="primary" size="md">
                Bildirim Gönder
              </AdminActionButton>
            </form>

            <form action={bildirimTercihleriniKaydet} className="space-y-0">
              <input type="hidden" name="id" value={localPreferences.id} />
              {bildirimSatirlari.map((row, idx) => {
                const on = localPreferences[row.key];
                return (
                  <div
                    key={row.key}
                    className={`flex flex-col gap-4 border-[#F1F5F9] py-4 sm:flex-row sm:items-center sm:justify-between ${
                      idx < bildirimSatirlari.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-medium text-[#1E293B]">{row.baslik}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#64748B]">{row.aciklama}</p>
                    </div>
                    <input type="hidden" name={row.key} value={on ? "on" : ""} />
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      title={on ? "Açık" : "Kapalı"}
                      onClick={() =>
                        setLocalPreferences((prev) => ({
                          ...prev,
                          [row.key]: !prev[row.key],
                        }))
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                        on ? "bg-[#1D9E75]" : "bg-[#E2E8F0]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          on ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
              <div className="flex justify-end border-t border-[#F1F5F9] pt-6">
                <AdminActionButton type="submit" variant="success" size="md">
                  Kaydet
                </AdminActionButton>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}
