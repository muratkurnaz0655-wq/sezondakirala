"use server";

import { Resend } from "resend";
import { getPlatformSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

type SendReservationConfirmationInput = {
  email: string;
  adSoyad: string;
  referansNo: string;
};

export async function sendReservationConfirmation(
  input: SendReservationConfirmationInput,
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return { success: false, error: "E-posta servisi henüz hazır değil." };
  }

  try {
    const settings = await getPlatformSettings();
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: input.email,
      subject: "Rezervasyon Onayı",
      html: `
        <h2>Rezervasyonunuz alındı</h2>
        <p>Sayın ${input.adSoyad}, rezervasyon talebiniz başarıyla alındı.</p>
        <p>Referans Numaranız: <strong>${input.referansNo}</strong></p>
        <hr />
        <p>TURSAB Belge No: ${settings.tursabNo}</p>
      `,
    });

    return { success: true };
  } catch {
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
        return { success: true as const, id: data.id };
      }
    }
  }

  return { success: false as const, error: "Rezervasyon kaydedilemedi. Lütfen bilgileri kontrol edip tekrar deneyin." };
}
