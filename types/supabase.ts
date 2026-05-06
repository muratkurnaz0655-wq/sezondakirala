export type UserRole = "ziyaretci" | "ilan_sahibi" | "admin";
export type ListingType = "villa" | "tekne";
export type AvailabilityStatus = "musait" | "dolu" | "ozel_fiyat";
export type ReservationStatus = "beklemede" | "onaylandi" | "iptal";
export type PaymentMethod = "kart" | "havale";
export type MediaType = "resim" | "video";
export type PackageCategory = "macera" | "luks" | "romantik" | "aile";

export type Kullanici = {
  id: string;
  email: string;
  ad_soyad: string | null;
  telefon: string | null;
  rol: UserRole;
  avatar_url: string | null;
  olusturulma_tarihi: string;
};

export type Ilan = {
  id: string;
  sahip_id: string;
  tip: ListingType;
  baslik: string;
  aciklama: string;
  slug: string | null;
  konum: string;
  gunluk_fiyat: number;
  temizlik_ucreti: number;
  kapasite: number;
  yatak_odasi: number;
  banyo: number;
  ozellikler: Record<string, boolean>;
  aktif: boolean;
  sponsorlu: boolean;
  olusturulma_tarihi: string;
  ilk_resim_url?: string | null;
};

export type IlanMedyasi = {
  id: string;
  ilan_id: string;
  url: string;
  tip: MediaType;
  sira: number;
};

export type Musaitlik = {
  id: string;
  ilan_id: string;
  tarih: string;
  durum: AvailabilityStatus;
  fiyat_override: number | null;
};

export type SezonFiyati = {
  id: string;
  ilan_id: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  gunluk_fiyat: number;
};

export type Paket = {
  id: string;
  baslik: string;
  kategori: PackageCategory;
  aciklama: string;
  sure_gun: number;
  kapasite: number;
  fiyat: number;
  ilan_idleri: string[];
  slug: string;
  gorsel_url?: string | null;
  aktif: boolean;
  olusturulma_tarihi?: string;
};

export type Rezervasyon = {
  id: string;
  kullanici_id: string;
  ilan_id: string;
  paket_id: string | null;
  giris_tarihi: string;
  cikis_tarihi: string;
  misafir_sayisi: number;
  toplam_fiyat: number;
  durum: ReservationStatus;
  odeme_yontemi: PaymentMethod;
  referans_no: string;
  olusturulma_tarihi: string;
};

export type Yorum = {
  id: string;
  rezervasyon_id: string;
  kullanici_id: string;
  ilan_id: string;
  puan: number;
  yorum: string;
  olusturulma_tarihi: string;
};

export type Mesaj = {
  id: string;
  gonderen_id: string;
  alici_id: string;
  ilan_id: string | null;
  icerik: string;
  okundu: boolean;
  olusturulma_tarihi: string;
};
