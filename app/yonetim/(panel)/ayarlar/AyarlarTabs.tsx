"use client";

import { useState } from "react";
import { Bell, Globe, History } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AyarlarForm, type AyarlarFormMevcut } from "./AyarlarForm";

type LogRow = {
  id: string;
  tarih: string;
  kullanici: string;
  islem: string;
  etkilenen_kayit: string | null;
};

export function AyarlarTabs({ mevcutAyarlar, logs }: { mevcutAyarlar: AyarlarFormMevcut; logs: LogRow[] }) {
  const [activeTab, setActiveTab] = useState<"genel" | "log" | "bildirim">("genel");
  const [preferences, setPreferences] = useState({
    reservationEmail: true,
    userEmail: false,
    stalePendingWarning: true,
  });

  return (
    <section className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        <AdminActionButton variant={activeTab === "genel" ? "primary" : "secondary"} onClick={() => setActiveTab("genel")}>
          <Globe className="h-4 w-4" />
          Genel Ayarlar
        </AdminActionButton>
        <AdminActionButton variant={activeTab === "log" ? "primary" : "secondary"} onClick={() => setActiveTab("log")}>
          <History className="h-4 w-4" />
          İşlem Geçmişi
        </AdminActionButton>
        <AdminActionButton variant={activeTab === "bildirim" ? "primary" : "secondary"} onClick={() => setActiveTab("bildirim")}>
          <Bell className="h-4 w-4" />
          Bildirim Tercihleri
        </AdminActionButton>
      </div>

      {activeTab === "genel" ? <AyarlarForm mevcutAyarlar={mevcutAyarlar} /> : null}

      {activeTab === "log" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Tarih</th>
                <th className="px-4 py-3 text-left">Kullanıcı</th>
                <th className="px-4 py-3 text-left">İşlem</th>
                <th className="px-4 py-3 text-left">Etkilenen kayıt</th>
              </tr>
            </thead>
            <tbody>
              {logs.length ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">{new Date(log.tarih).toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3">{log.kullanici}</td>
                    <td className="px-4 py-3">{log.islem}</td>
                    <td className="px-4 py-3">{log.etkilenen_kayit ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Henüz kayıt yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === "bildirim" ? (
        <div className="space-y-3">
          {[
            ["reservationEmail", "Yeni rezervasyonda e-posta gönder"],
            ["userEmail", "Yeni kullanıcı kaydında e-posta gönder"],
            ["stalePendingWarning", "Beklemedeki rezervasyon 24 saat geçerse uyar"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              {label}
              <input
                type="checkbox"
                checked={preferences[key as keyof typeof preferences]}
                onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))}
                className="h-5 w-5 accent-blue-600"
              />
            </label>
          ))}
        </div>
      ) : null}
    </section>
  );
}
