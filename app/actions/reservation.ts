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

function formatTrDateYmd(ymd: string): string {
  const d = new Date(`${ymd.trim()}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
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
};

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
    const safe = {
      adSoyad: escapeHtml(input.adSoyad.trim()),
      ilan: escapeHtml(input.ilanBaslik.trim()),
      giris: escapeHtml(formatTrDateYmd(input.girisTarihi)),
      cikis: escapeHtml(formatTrDateYmd(input.cikisTarihi)),
      misafir: escapeHtml(String(input.misafirSayisi)),
      toplam: escapeHtml(toplamStr),
      ref: escapeHtml(input.referansNo),
      tursab: escapeHtml(settings.tursabNo),
    };
    await resend.emails.send({
      from,
      to: input.email,
      subject,
      html: `
        <p>Merhaba ${safe.adSoyad},</p>
        <p>Rezervasyon talebiniz alındı. Özet bilgiler aşağıdadır.</p>
        <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="border:1px solid #e5e7eb;"><strong>İlan</strong></td><td style="border:1px solid #e5e7eb;">${safe.ilan}</td></tr>
          <tr><td style="border:1px solid #e5e7eb;"><strong>Giriş</strong></td><td style="border:1px solid #e5e7eb;">${safe.giris}</td></tr>
          <tr><td style="border:1px solid #e5e7eb;"><strong>Çıkış</strong></td><td style="border:1px solid #e5e7eb;">${safe.cikis}</td></tr>
          <tr><td style="border:1px solid #e5e7eb;"><strong>Misafir sayısı</strong></td><td style="border:1px solid #e5e7eb;">${safe.misafir}</td></tr>
          <tr><td style="border:1px solid #e5e7eb;"><strong>Toplam tutar</strong></td><td style="border:1px solid #e5e7eb;">${safe.toplam}</td></tr>
          <tr><td style="border:1px solid #e5e7eb;"><strong>Referans no</strong></td><td style="border:1px solid #e5e7eb;">${safe.ref}</td></tr>
        </table>
        <p style="color:#64748b;font-size:13px;">TURSAB Belge No: ${safe.tursab}</p>
      `,
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
