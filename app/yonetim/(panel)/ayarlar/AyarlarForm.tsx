"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { ayarlariKaydet } from "./actions";
import { AdminFormField, AdminInput } from "@/components/admin/AdminFormControls";
import { AdminActionButton } from "@/components/admin/AdminActionButton";

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
    <form onSubmit={(ev) => void handleSubmit(ev)} className="space-y-8">
      <div>
        <h3 className="mb-4 border-b border-[#F1F5F9] pb-3 text-sm font-semibold text-[#1E293B]">İletişim Bilgileri</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <AdminFormField label="WhatsApp Numarası">
            <AdminInput name="whatsapp_number" defaultValue={mevcutAyarlar.whatsapp_number} />
          </AdminFormField>
          <AdminFormField label="İletişim Telefonu">
            <AdminInput name="iletisim_telefon" defaultValue={mevcutAyarlar.iletisim_telefon} />
          </AdminFormField>
          <AdminFormField label="E-posta" className="md:col-span-2">
            <AdminInput name="iletisim_email" type="email" defaultValue={mevcutAyarlar.iletisim_email} />
          </AdminFormField>
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b border-[#F1F5F9] pb-3 text-sm font-semibold text-[#1E293B]">Platform Bilgileri</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <AdminFormField label="TURSAB Belge No">
            <AdminInput name="tursab_no" defaultValue={mevcutAyarlar.tursab_no} />
          </AdminFormField>
          <AdminFormField label="Komisyon Oranı (%)">
            <AdminInput
              name="komisyon_orani"
              type="number"
              min={0}
              max={100}
              defaultValue={Math.round((mevcutAyarlar.komisyon_orani ?? 0.1) * 100)}
            />
          </AdminFormField>
          <AdminFormField label="Site Adı">
            <AdminInput name="site_adi" defaultValue={mevcutAyarlar.site_adi} />
          </AdminFormField>
          <AdminFormField label="Slogan">
            <AdminInput name="site_slogan" defaultValue={mevcutAyarlar.site_slogan} />
          </AdminFormField>
        </div>
      </div>

      <div className="flex justify-end border-t border-[#F1F5F9] pt-6">
        <AdminActionButton type="submit" disabled={yukleniyor} variant="success" size="md">
          <Save className="h-4 w-4" aria-hidden />
          {yukleniyor ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </AdminActionButton>
      </div>
      {durum ? (
        <span
          className={`block text-sm font-medium ${
            durum.toLowerCase().includes("kaydedildi") ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {durum}
        </span>
      ) : null}
    </form>
  );
}
