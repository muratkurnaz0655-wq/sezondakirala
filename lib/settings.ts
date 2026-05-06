import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_WHATSAPP_NUMBER,
  SITE_NAME,
  TURSAB_NO,
  formatWhatsappTrDisplay,
} from "@/lib/constants";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { getPublicSupabase } from "@/lib/supabase/public-anon";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";

export type PlatformSettings = {
  komisyonOrani: number;
  tursabNo: string;
  whatsappNumber: string;
  siteName: string;
  siteSlogan: string;
  contactEmail: string;
  contactPhone: string;
  /** Tabloda kolon yok; varsayılan true */
  notificationEnabled: boolean;
};

/** Supabase veya `ayarlar` sorgusu başarısız olduğunda dönüş değeri */
export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  komisyonOrani: DEFAULT_COMMISSION_RATE,
  tursabNo: TURSAB_NO,
  whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
  siteName: SITE_NAME,
  siteSlogan: "Fethiye'nin tatil platformu",
  contactEmail: "info@sezondakirala.com",
  contactPhone: formatWhatsappTrDisplay(DEFAULT_WHATSAPP_NUMBER),
  notificationEnabled: true,
};

type AyarlarRow = {
  tursab_no: string | null;
  whatsapp_number: string | null;
  komisyon_orani: number | string | null;
  site_adi: string | null;
  site_slogan: string | null;
  iletisim_email: string | null;
  iletisim_telefon: string | null;
};

function rowToPlatformSettings(row: AyarlarRow): PlatformSettings {
  const k = row.komisyon_orani;
  const komisyonOrani = typeof k === "number" ? k : Number(k);
  return {
    komisyonOrani: Number.isFinite(komisyonOrani) ? komisyonOrani : DEFAULT_COMMISSION_RATE,
    tursabNo: row.tursab_no || TURSAB_NO,
    whatsappNumber: row.whatsapp_number || DEFAULT_WHATSAPP_NUMBER,
    siteName: fixTurkishDisplay(row.site_adi || SITE_NAME) || SITE_NAME,
    siteSlogan: fixTurkishDisplay(row.site_slogan || "Fethiye'nin tatil platformu") || "Fethiye'nin tatil platformu",
    contactEmail: row.iletisim_email || "info@sezondakirala.com",
    contactPhone: row.iletisim_telefon || formatWhatsappTrDisplay(DEFAULT_WHATSAPP_NUMBER),
    notificationEnabled: true,
  };
}

/** Tablo yok / RLS / şema: varsayılan ayarlara düşülür; log kirletilmez */
function isAyarlarUnavailableError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  const code = String(error.code ?? "");
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    (msg.includes("relation") && msg.includes("ayarlar")) ||
    msg.includes("permission denied")
  );
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!isSupabaseEnvConfigured()) {
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }

  try {
    const supabase = getPublicSupabase();
    if (!supabase) {
      return { ...DEFAULT_PLATFORM_SETTINGS };
    }

    const { data, error } = await supabase
      .from("ayarlar")
      .select(
        "tursab_no, whatsapp_number, komisyon_orani, site_adi, site_slogan, iletisim_email, iletisim_telefon",
      )
      .order("olusturulma_tarihi", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (!isAyarlarUnavailableError(error)) {
        console.warn("[getPlatformSettings]", error.code, error.message);
      }
      return { ...DEFAULT_PLATFORM_SETTINGS };
    }

    if (!data) {
      return { ...DEFAULT_PLATFORM_SETTINGS };
    }

    return rowToPlatformSettings(data as AyarlarRow);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      !msg.includes("Dynamic server usage") &&
      !msg.includes("cookies") &&
      !isAyarlarUnavailableError({ message: msg })
    ) {
      console.warn("[getPlatformSettings]", e);
    }
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }
}
