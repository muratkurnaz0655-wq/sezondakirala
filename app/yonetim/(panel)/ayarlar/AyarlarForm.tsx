"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { ayarlariKaydet } from "./actions";

export type AyarlarFormMevcut = {
  tursab_no: string;
  whatsapp_number: string;
  komisyon_orani: number;
  site_adi: string;
  site_slogan: string;
  iletisim_email: string;
  iletisim_telefon: string;
};

type AyarlarFormProps = {
  mevcutAyarlar: AyarlarFormMevcut;
};

export function AyarlarForm({ mevcutAyarlar }: AyarlarFormProps) {
  const [durum, setDurum] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setYukleniyor(true);
    const formData = new FormData(e.currentTarget);
    const sonuc = await ayarlariKaydet(formData);
    setDurum(sonuc.mesaj);
    setYukleniyor(false);
  }

  return (
    <form onSubmit={(ev) => void handleSubmit(ev)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-semibold text-slate-800">📞 İletişim Bilgileri</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">WhatsApp Numarası</label>
            <input
              name="whatsapp_number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              defaultValue={mevcutAyarlar.whatsapp_number}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">İletişim Telefonu</label>
            <input
              name="iletisim_telefon"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              defaultValue={mevcutAyarlar.iletisim_telefon}
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-400">E-posta</label>
            <input
              name="iletisim_email"
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              defaultValue={mevcutAyarlar.iletisim_email}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-semibold text-slate-800">🏢 Platform Bilgileri</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">TURSAB Belge No</label>
            <input name="tursab_no" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" defaultValue={mevcutAyarlar.tursab_no} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Komisyon Oranı (%)</label>
            <input
              name="komisyon_orani"
              type="number"
              min={0}
              max={100}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              defaultValue={Math.round((mevcutAyarlar.komisyon_orani ?? 0.1) * 100)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Site Adı</label>
            <input name="site_adi" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" defaultValue={mevcutAyarlar.site_adi} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Slogan</label>
            <input name="site_slogan" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" defaultValue={mevcutAyarlar.site_slogan} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={yukleniyor} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50">
          <Save className="h-4 w-4" />
          {yukleniyor ? "Kaydediliyor..." : "💾 Değişiklikleri Kaydet"}
        </button>
      </div>
      {durum ? (
        <span
          className={`block text-sm font-medium ${
            durum.toLowerCase().includes("kaydedildi") ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {durum.toLowerCase().includes("kaydedildi") ? "✅ " : "❌ "}
          {durum}
        </span>
      ) : null}
    </form>
  );
}
