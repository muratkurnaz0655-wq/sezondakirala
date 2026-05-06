import { STORAGE_BUCKET } from "@/lib/constants";

/** Supabase Storage yükleme hatalarını kullanıcıya anlaşılır metne çevirir. */
export function storageUploadUserMessage(raw: string | undefined): string {
  const msg = (raw ?? "").trim();
  if (/bucket not found/i.test(msg)) {
    return `Depolama kovası bulunamadı (“${STORAGE_BUCKET}”). Supabase Dashboard → Storage üzerinden bu adda herkese açık bir kova oluşturun; veya .env içinde SUPABASE_STORAGE_BUCKET değerini projedeki kova adınıza göre ayarlayın. Repodaki supabase/migrations dosyasını SQL Editor’da çalıştırmak da kovayı ve izinleri ekler.`;
  }
  if (/row-level security|new row violates row-level security/i.test(msg)) {
    return `Depolama izni reddedildi (RLS). Oturumunuzun açık olduğundan emin olun; Supabase’de “${STORAGE_BUCKET}” kovası için authenticated INSERT politikası olmalı (repodaki storage migration).`;
  }
  if (/payload too large|body exceeded|request entity too large|413/i.test(msg)) {
    return "Yukleme boyutu sunucu limitini asti. Daha kucuk fotograflar deneyin veya site yoneticisi next.config icinde serverActions.bodySizeLimit degerini artirsin.";
  }
  return msg || "Depolama hatası.";
}
