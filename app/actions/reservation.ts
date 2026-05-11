"use server";

import { Resend } from "resend";
import { getPlatformSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** gg.aa.yyyy (e-posta tablosu; HTML kaçışı üst katmanda) */
function formatTrDateNumeric(ymd: string): string {
  const d = new Date(`${ymd.trim()}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd.trim();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function nightsBetweenYmd(giris: string, cikis: string): number {
  const a = new Date(`${giris.trim()}T00:00:00`);
  const b = new Date(`${cikis.trim()}T00:00:00`);
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff || 1);
}

function odemeYontemiMetni(method: "kart" | "havale"): string {
  return method === "kart" ? "Kredi / Banka Kartı" : "Havale / EFT";
}

type SendReservationConfirmationInput = {
  email: string;
  adSoyad: string;
  referansNo: string;
  ilanBaslik: string;
  girisTarihi: string;
  cikisTarihi: string;
  misafirSayisi: number;
  toplamFiyat: number;
  odemeYontemi: "kart" | "havale";
};

function buildReservationConfirmationEmailHtml(params: {
  siteName: string;
  siteTagline: string;
  adSoyad: string;
  referansNo: string;
  ilanBaslik: string;
  girisTr: string;
  cikisTr: string;
  geceSayisi: number;
  misafirSayisi: number;
  odemeLabel: string;
  toplamStr: string;
  tursabNo: string;
  whatsappHref: string;
  whatsappDisplay: string;
  contactEmail: string;
}): string {
  const c = (s: string) => escapeHtml(s);
  const {
    siteName,
    siteTagline,
    adSoyad,
    referansNo,
    ilanBaslik,
    girisTr,
    cikisTr,
    geceSayisi,
    misafirSayisi,
    odemeLabel,
    toplamStr,
    tursabNo,
    whatsappHref,
    whatsappDisplay,
    contactEmail,
  } = params;

  const rowB = "border-bottom:1px solid #e8e8e8;";
  const labelCell = `padding:12px 8px 12px 0;vertical-align:top;width:42%;color:#555555;font-size:14px;font-family:Arial,sans-serif;${rowB}`;
  const valueCell = `padding:12px 0 12px 8px;vertical-align:top;color:#111111;font-size:14px;font-family:Arial,sans-serif;${rowB}`;

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f4;font-family:Arial,sans-serif;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;">
<tr>
<td align="center" style="background-color:#185FA5;padding:28px 20px;font-family:Arial,sans-serif;">
<div style="color:#ffffff;font-size:26px;font-weight:bold;line-height:1.2;">${c(siteName)}</div>
<div style="color:#dbeafe;font-size:13px;margin-top:8px;line-height:1.4;">${c(siteTagline)}</div>
</td>
</tr>
<tr>
<td style="padding:32px 28px 24px;font-family:Arial,sans-serif;background-color:#ffffff;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td align="center" style="font-size:52px;line-height:1;color:#1D9E75;font-family:Arial,sans-serif;">&#10003;</td>
</tr></table>
<div style="text-align:center;margin-top:12px;font-size:15px;color:#444444;font-family:Arial,sans-serif;">Say&#305;n ${c(adSoyad)}</div>
<div style="text-align:center;margin-top:16px;font-size:24px;font-weight:bold;color:#1a1a1a;font-family:Arial,sans-serif;">Rezervasyonunuz Al&#305;nd&#305;!</div>
<div style="text-align:center;margin-top:12px;font-size:14px;color:#666666;line-height:1.5;font-family:Arial,sans-serif;">En k&#305;sa s&#252;rede sizi arayarak rezervasyonunuzu onaylayaca&#287;&#305;z.</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;background-color:#EBF4FF;border:1px solid #185FA5;border-radius:8px;">
<tr><td style="padding:20px;font-family:Arial,sans-serif;">
<div style="font-size:11px;letter-spacing:0.08em;color:#666666;text-align:center;font-family:Arial,sans-serif;">REFERANS NUMARANIZ</div>
<div style="text-align:center;margin-top:10px;font-size:26px;font-weight:bold;color:#185FA5;letter-spacing:0.04em;font-family:Arial,sans-serif;">${c(referansNo)}</div>
<div style="text-align:center;margin-top:10px;font-size:12px;color:#555555;font-family:Arial,sans-serif;">Bu numaray&#305; kaydediniz</div>
</td></tr></table>
<div style="margin-top:28px;font-size:16px;font-weight:bold;color:#185FA5;font-family:Arial,sans-serif;">Rezervasyon Detaylar&#305;</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:12px;border-collapse:collapse;">
<tr><td style="${labelCell}">&#304;lan Ad&#305;</td><td style="${valueCell}">${c(ilanBaslik)}</td></tr>
<tr><td style="${labelCell}">Giri&#351; Tarihi</td><td style="${valueCell}">${c(girisTr)}</td></tr>
<tr><td style="${labelCell}">&#199;&#305;k&#305;&#351; Tarihi</td><td style="${valueCell}">${c(cikisTr)}</td></tr>
<tr><td style="${labelCell}">Gece Say&#305;s&#305;</td><td style="${valueCell}">${geceSayisi}</td></tr>
<tr><td style="${labelCell}">Misafir Say&#305;s&#305;</td><td style="${valueCell}">${misafirSayisi}</td></tr>
<tr><td style="${labelCell}">&#214;deme Y&#246;ntemi</td><td style="${valueCell}">${c(odemeLabel)}</td></tr>
<tr><td style="padding:14px 8px 0 0;vertical-align:top;width:42%;color:#555555;font-size:14px;font-family:Arial,sans-serif;border-bottom:none;">Toplam Tutar</td><td style="padding:14px 0 0 8px;vertical-align:top;font-size:18px;font-weight:bold;color:#185FA5;font-family:Arial,sans-serif;border-bottom:none;">${c(toplamStr)}</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;background-color:#FFF8E7;border-left:4px solid #EF9F27;">
<tr><td style="padding:16px 18px;font-size:14px;color:#444444;line-height:1.55;font-family:Arial,sans-serif;">
&#128203; Rezervasyonunuz inceleme a&#351;amas&#305;ndad&#305;r. Ekibimiz en k&#305;sa s&#252;rede sizinle ileti&#351;ime ge&#231;erek onay verecektir.
</td></tr></table>
<div style="margin-top:28px;font-size:14px;color:#333333;font-family:Arial,sans-serif;">Sorular&#305;n&#305;z i&#231;in bizimle ileti&#351;ime ge&#231;in:</div>
<div style="margin-top:10px;font-size:14px;font-family:Arial,sans-serif;">
<a href="${c(whatsappHref)}" style="color:#185FA5;font-weight:bold;text-decoration:underline;">WhatsApp: ${c(whatsappDisplay)}</a>
</div>
<div style="margin-top:8px;font-size:14px;font-family:Arial,sans-serif;">
<a href="mailto:${c(contactEmail)}" style="color:#185FA5;font-weight:bold;text-decoration:underline;">E-posta: ${c(contactEmail)}</a>
</div>
</td>
</tr>
<tr>
<td align="center" style="background-color:#f4f4f4;padding:24px 20px;font-size:12px;color:#777777;line-height:1.6;font-family:Arial,sans-serif;">
<div>TURSAB &#220;yesidir &#8212; Belge No: ${c(tursabNo)}</div>
<div style="margin-top:10px;"><a href="https://sezondakirala.com" style="color:#185FA5;text-decoration:underline;">sezondakirala.com</a></div>
<div style="margin-top:12px;max-width:480px;margin-left:auto;margin-right:auto;">Bu e-posta otomatik olarak g&#246;nderilmi&#351;tir. L&#252;tfen yan&#305;tlamay&#305;n&#305;z.</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export async function sendReservationConfirmation(
  input: SendReservationConfirmationInput,
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { success: false, error: "E-posta servisi henüz hazır değil." };
  }

  const from = process.env.RESEND_FROM_EMAIL;
  const subject = `Rezervasyonunuz Alındı — ${input.referansNo}`;
  const toplamStr = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(input.toplamFiyat);

  try {
    const settings = await getPlatformSettings();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const waDigits = settings.whatsappNumber.replace(/\D/g, "");
    const whatsappHref = waDigits ? `https://wa.me/${waDigits}` : "https://wa.me/";
    const geceSayisi = nightsBetweenYmd(input.girisTarihi, input.cikisTarihi);
    const girisTr = formatTrDateNumeric(input.girisTarihi);
    const cikisTr = formatTrDateNumeric(input.cikisTarihi);
    const odemeLabel = odemeYontemiMetni(input.odemeYontemi);
    const whatsappDisplay =
      settings.contactPhone?.trim() || (waDigits ? `+${waDigits}` : settings.whatsappNumber);

    const html = buildReservationConfirmationEmailHtml({
      siteName: settings.siteName,
      siteTagline: "Fethiye Villa ve Tekne Kiralama",
      adSoyad: input.adSoyad.trim(),
      referansNo: input.referansNo,
      ilanBaslik: input.ilanBaslik.trim(),
      girisTr,
      cikisTr,
      geceSayisi,
      misafirSayisi: input.misafirSayisi,
      odemeLabel,
      toplamStr,
      tursabNo: settings.tursabNo,
      whatsappHref,
      whatsappDisplay,
      contactEmail: "info@sezondakirala.com",
    });

    await resend.emails.send({
      from,
      to: input.email,
      subject,
      html,
    });

    return { success: true };
  } catch (e) {
    console.error("[sendReservationConfirmation]", e);
    return { success: false, error: "Onay e-postası gönderilemedi." };
  }
}

type CreateReservationInput = {
  ilanId: string;
  paketId?: string | null;
  girisTarihi: string;
  cikisTarihi: string;
  misafirSayisi: number;
  toplamFiyat: number;
  odemeYontemi: "kart" | "havale";
  referansNo: string;
};

function reservationStatusInsertCandidates() {
  return ["beklemede", "pending"];
}

function paymentMethodInsertCandidates(method: "kart" | "havale") {
  if (method === "kart") {
    return ["kart", "kredi_karti", "credit_card"];
  }
  return ["havale", "havale_eft", "bank_transfer"];
}

export async function createReservation(input: CreateReservationInput) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false as const, error: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın." };
  }

  const basePayload = {
    kullanici_id: user.id,
    ilan_id: input.ilanId,
    paket_id: input.paketId ?? null,
    giris_tarihi: input.girisTarihi,
    cikis_tarihi: input.cikisTarihi,
    misafir_sayisi: input.misafirSayisi,
    toplam_fiyat: input.toplamFiyat,
    referans_no: input.referansNo,
  };

  for (const durum of reservationStatusInsertCandidates()) {
    for (const odemeYontemi of paymentMethodInsertCandidates(input.odemeYontemi)) {
      const { data, error } = await supabase
        .from("rezervasyonlar")
        .insert({
          ...basePayload,
          durum,
          odeme_yontemi: odemeYontemi,
        })
        .select("id")
        .single();
      if (!error && data?.id) {
        // Use service role so notification creation is not blocked by RLS.
        const adminSupabase = createAdminClient();
        const notificationPayload = {
          tip: "yeni_rezervasyon",
          baslik: "Rezervasyonunuz oluşturuldu",
          mesaj: `Rezervasyonunuz başarıyla alındı. Rezervasyon No: ${input.referansNo}`,
          entity_tip: "rezervasyon",
          entity_id: data.id,
          hedef_kullanici_id: user.id,
          okundu: false,
        };
        const { error: notificationError } = await adminSupabase.from("bildirimler").insert(notificationPayload);
        // Backward compatibility: environments without hedef_kullanici_id column.
        if (notificationError) {
          await adminSupabase.from("bildirimler").insert({
            tip: notificationPayload.tip,
            baslik: notificationPayload.baslik,
            mesaj: notificationPayload.mesaj,
            entity_tip: notificationPayload.entity_tip,
            entity_id: notificationPayload.entity_id,
            okundu: notificationPayload.okundu,
          });
        }
        return { success: true as const, id: data.id };
      }
    }
  }

  return { success: false as const, error: "Rezervasyon kaydedilemedi. Lütfen bilgileri kontrol edip tekrar deneyin." };
}
