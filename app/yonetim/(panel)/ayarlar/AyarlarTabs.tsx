"use client";

import { useState } from "react";
import { Bell, Globe, History } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
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
                    <td className="px-4 py-3">{new Date(log.olusturulma_tarihi).toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3">{log.kullanici_email ?? "-"}</td>
                    <td className="px-4 py-3">{log.islem}</td>
                    <td className="px-4 py-3">{log.entity_baslik ?? log.entity_tip ?? "-"}</td>
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
        <div className="space-y-6">
          <form action={topluBildirimGonder} className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Tüm Kullanıcılara Duyuru Gönder</h3>
            <input
              name="baslik"
              required
              placeholder="Bildirim başlığı"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            />
            <textarea
              name="mesaj"
              required
              rows={4}
              placeholder="Kullanıcıların zilden göreceği duyuru mesajı..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
            />
            <AdminActionButton type="submit" variant="primary">Bildirim Gönder</AdminActionButton>
          </form>

          <form action={bildirimTercihleriniKaydet} className="space-y-3">
            <input type="hidden" name="id" value={localPreferences.id} />
            {[
              ["yeni_rezervasyonda_bildir", "Yeni rezervasyonda bildir"],
              ["yeni_kullanicida_bildir", "Yeni kullanıcı kaydında bildir"],
              ["beklemede_24saat_bildir", "24 saat beklemedeki rezervasyonlarda uyar"],
              ["iptal_edildiginde_bildir", "İptal edildiğinde bildir"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                {label}
                <input
                  name={key}
                  type="checkbox"
                  checked={localPreferences[key as keyof typeof localPreferences] as boolean}
                  onChange={(event) => setLocalPreferences((current) => ({ ...current, [key]: event.target.checked }))}
                  className="h-5 w-5 accent-blue-600"
                />
              </label>
            ))}
            <AdminActionButton type="submit" variant="primary">Tercihleri Kaydet</AdminActionButton>
          </form>
        </div>
      ) : null}
    </section>
  );
}
