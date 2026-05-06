export const BOLGELER = [
  "Göcek, Fethiye",
  "Çalış, Fethiye",
  "Ölüdeniz, Fethiye",
  "Ölüdeniz İskelesi",
  "Hisarönü, Fethiye",
  "Kayaköy, Fethiye",
  "Faralya, Fethiye",
  "Fethiye Merkez",
  "Fethiye Marina",
] as const;

export const KATEGORILER = [
  { value: "luks", label: "💎 Lüks" },
  { value: "romantik", label: "❤️ Romantik" },
  { value: "macera", label: "🏕️ Macera" },
  { value: "aile", label: "👨‍👩‍👧‍👦 Aile" },
] as const;

export const OZELLIKLER = [
  { value: "havuz", label: "🏊 Özel Havuz" },
  { value: "jakuzi", label: "🛁 Jakuzi" },
  { value: "deniz_manzarasi", label: "🌊 Deniz Manzarası" },
  { value: "wifi", label: "📶 Wi-Fi" },
  { value: "klima", label: "❄️ Klima" },
  { value: "bbq", label: "🔥 BBQ / Mangal" },
  { value: "bahce", label: "🌿 Bahçe" },
  { value: "sauna", label: "🧖 Sauna" },
  { value: "akilli_ev", label: "🏠 Akıllı Ev" },
  { value: "evcil_hayvan", label: "🐾 Evcil Hayvan" },
  { value: "cocuk_havuzu", label: "👶 Çocuk Havuzu" },
  { value: "isitmali_havuz", label: "🌡️ Isıtmalı Havuz" },
  { value: "tv", label: "📺 TV" },
  { value: "at_binme", label: "🐴 At Binme" },
] as const;

export const TEKNE_LIMANLARI = [
  "Göcek, Fethiye",
  "Fethiye Merkez",
  "Ölüdeniz, Fethiye",
  "Çalış, Fethiye",
] as const;

export const TEKNE_TIPLERI = [
  { value: "gulet", label: "⛵ Gulet" },
  { value: "motoryat", label: "🚤 Motoryat" },
  { value: "yelkenli", label: "🌬️ Yelkenli" },
  { value: "katamaran", label: "🛥️ Katamaran" },
  { value: "surat", label: "💨 Sürat Teknesi" },
] as const;

export const TEKNE_OZELLIKLERI = [
  { value: "kaptan_dahil", label: "👨‍✈️ Kaptan Dahil" },
  { value: "murettebat_dahil", label: "👥 Mürettebat Dahil" },
  { value: "yemek_dahil", label: "🍽️ Yemek Dahil" },
  { value: "yiyecek_dahil", label: "🥗 Atıştırmalık Dahil" },
  { value: "wifi", label: "📶 Wi-Fi" },
  { value: "klima", label: "❄️ Klima" },
  { value: "jakuzi", label: "🛁 Jakuzi" },
  { value: "snorkel", label: "🤿 Şnorkel Ekipmanı" },
  { value: "kayak", label: "🏄 Kayak / Kano" },
  { value: "balik_tutma", label: "🎣 Balık Tutma" },
  { value: "ekipman_dahil", label: "🎒 Tüm Ekipmanlar" },
  { value: "rehber_dahil", label: "🗺️ Rehber Dahil" },
] as const;

export const TEKNE_SURE_SECENEKLERI = [
  { value: "gunluk", label: "☀️ Günlük" },
  { value: "haftalik", label: "📅 Haftalık" },
] as const;

export interface TekneFiltre {
  liman: string[];
  tekne_tipi: string[];
  minFiyat: number;
  maxFiyat: number;
  minKapasite: number;
  sure: string[];
  ozellikler: string[];
  siralama: "onerilen" | "fiyat_artan" | "fiyat_azalan" | "kapasite_buyuk";
}

export const defaultTekneFiltre: TekneFiltre = {
  liman: [],
  tekne_tipi: [],
  minFiyat: 0,
  maxFiyat: 15000,
  minKapasite: 1,
  sure: [],
  ozellikler: [],
  siralama: "onerilen",
};
