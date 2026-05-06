import { createClient } from "@supabase/supabase-js";
import { Globe } from "lucide-react";
import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_TURSAB_NO,
  DEFAULT_WHATSAPP_NUMBER,
  SITE_NAME,
  formatWhatsappTrDisplay,
} from "@/lib/constants";
import { AdminStatsRow } from "@/components/admin/AdminStatsRow";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { AyarlarForm } from "./AyarlarForm";

type AyarlarRow = {
  id?: string;
  olusturulma_tarihi?: string | null;
  tursab_no: string | null;
  whatsapp_number: string | null;
  komisyon_orani: number | string | null;
  site_adi: string | null;
  site_slogan: string | null;
  iletisim_email: string | null;
  iletisim_telefon: string | null;
};

export default async function AdminSettingsPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  let ayarlar: AyarlarRow | null = null;
  if (url && serviceKey) {
    const supabase = createClient(url, serviceKey);
    const { data } = await supabase
      .from("ayarlar")
      .select("*")
      .order("olusturulma_tarihi", { ascending: false })
      .limit(1)
      .maybeSingle();
    ayarlar = (data as AyarlarRow | null) ?? null;
  }

  const k = ayarlar?.komisyon_orani;
  const komisyonNum = typeof k === "number" ? k : Number(k);
  const komisyon_orani = Number.isFinite(komisyonNum) ? komisyonNum : DEFAULT_COMMISSION_RATE;

  const mevcutAyarlar = {
    tursab_no: ayarlar?.tursab_no ?? DEFAULT_TURSAB_NO,
    whatsapp_number: ayarlar?.whatsapp_number ?? DEFAULT_WHATSAPP_NUMBER,
    komisyon_orani,
    site_adi: ayarlar?.site_adi ?? SITE_NAME,
    site_slogan: ayarlar?.site_slogan ?? "",
    iletisim_email: ayarlar?.iletisim_email ?? "info@sezondakirala.com",
    iletisim_telefon: ayarlar?.iletisim_telefon ?? formatWhatsappTrDisplay(DEFAULT_WHATSAPP_NUMBER),
  };

  return (
    <AdminPageLayout
      title="Ayarlar"
      description="Platform iletişim ve operasyon ayarlarını merkezi olarak güncelleyin."
    >
      <AdminStatsRow
        items={[
          { label: "TURSAB No", value: mevcutAyarlar.tursab_no, tone: "info" },
          { label: "Komisyon", value: `%${Math.round((mevcutAyarlar.komisyon_orani ?? 0) * 100)}`, tone: "warning" },
          { label: "WhatsApp", value: formatWhatsappTrDisplay(mevcutAyarlar.whatsapp_number), tone: "success" },
          {
            label: "Son Güncelleme",
            value: ayarlar?.olusturulma_tarihi
              ? new Date(ayarlar.olusturulma_tarihi).toLocaleString("tr-TR")
              : "-",
            tone: "default",
          },
        ]}
      />
      <section className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-semibold text-slate-800">
          <Globe className="h-4 w-4 text-blue-600" />
          Genel Ayarlar
        </div>
        <AyarlarForm mevcutAyarlar={mevcutAyarlar} />
      </section>
    </AdminPageLayout>
  );
}
