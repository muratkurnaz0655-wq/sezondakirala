/**
 * Ana sayfa hero videosu (`public/videos/video.mp4`).
 * Dosyayı değiştirdiğinizde tarayıcı eski dosyayı tutabilir — `NEXT_PUBLIC_HERO_VIDEO_VERSION`
 * değerini artırın (örn. 2 → 3) ve yeniden build alın. İsteğe bağlı farklı dosya: `NEXT_PUBLIC_HERO_VIDEO_PATH`.
 */
export const HERO_VIDEO_PATH = process.env.NEXT_PUBLIC_HERO_VIDEO_PATH ?? "/videos/video.mp4";
export const HERO_VIDEO_VERSION = process.env.NEXT_PUBLIC_HERO_VIDEO_VERSION ?? "2";
export const HERO_VIDEO_SRC = `${HERO_VIDEO_PATH}${HERO_VIDEO_PATH.includes("?") ? "&" : "?"}v=${HERO_VIDEO_VERSION}`;

/** Marka adı: tek kelime, büyük S, küçük k — sezondakirala.com */
export const SITE_NAME = "Sezondakirala";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sezondakirala.com";
export const SITE_LOGO_PATH = "/logo-clean.png";
export const SITE_FAVICON_PATH = "/favicon.png";
/**
 * Supabase Storage kova adı. Dashboard’da yoksa migration ile oluşturun veya
 * `.env` içinde `SUPABASE_STORAGE_BUCKET` (sunucu) veya `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
 * ile projedeki gerçek kova adını verin.
 */
export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() ||
  "ilan-medyalari";
export const ADMIN_PATH = "/yonetim";
export const TURSAB_NO = "5141";
export const DEFAULT_TURSAB_NO = TURSAB_NO;
/** E.164 ülke kodu ile, + olmadan (wa.me için). Canlıda .env: NEXT_PUBLIC_WHATSAPP_NUMBER=905XXXXXXXXX */
export const DEFAULT_WHATSAPP_NUMBER = "905324251000";
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? DEFAULT_WHATSAPP_NUMBER;

/** 905XXXXXXXXX → +90 5XX XXX XX XX (görünen metin) */
export function formatWhatsappTrDisplay(e164Digits: string = WHATSAPP_NUMBER): string {
  const d = e164Digits.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("90")) {
    const n = d.slice(2);
    return `+90 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
  }
  if (d.length === 10 && d.startsWith("5")) {
    return `+90 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
  }
  return d ? `+${d}` : "";
}

export function whatsappHref(e164Digits: string = WHATSAPP_NUMBER) {
  return `https://wa.me/${e164Digits.replace(/\D/g, "")}`;
}
export const DEFAULT_COMMISSION_RATE = 0.1;
