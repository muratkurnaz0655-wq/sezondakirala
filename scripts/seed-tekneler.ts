import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const slugify = (text: string) =>
  text
    .split("")
    .map((c) =>
      (
        {
          ç: "c",
          ğ: "g",
          ı: "i",
          ö: "o",
          ş: "s",
          ü: "u",
          Ç: "c",
          Ğ: "g",
          İ: "i",
          Ö: "o",
          Ş: "s",
          Ü: "u",
        } as Record<string, string>
      )[c] ?? c,
    )
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const tekneler = [
  {
    baslik: "Göcek Özel Gulet — 8 Kişilik",
    aciklama:
      "Göcek Limanı'ndan kalkan bu özel ahşap gulet, Göcek adaları ve koylarını keşfetmek için biçilmiş kaftan. Deneyimli kaptan ve mürettebat eşliğinde unutulmaz bir mavi yolculuk deneyimi yaşayın.",
    konum: "Göcek, Fethiye",
    gunluk_fiyat: 4500,
    kapasite: 8,
    yatak_odasi: 4,
    banyo: 2,
    ozellikler: ["gulet", "kaptan_dahil", "murettebat_dahil", "wifi", "klima", "kayak", "snorkel", "gunluk"],
    gorseller: [
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80",
    ],
  },
  {
    baslik: "Fethiye Motorlu Yat — Günlük Tur",
    aciklama:
      "Fethiye Limanı'ndan sabah kalkan bu lüks motorlu yat, Ölüdeniz lagünü, Butterfly Valley ve St. Nicholas Adası'nı kapsayan günlük tur sunuyor. Öğle yemeği ve içecekler dahil.",
    konum: "Fethiye Merkez",
    gunluk_fiyat: 3200,
    kapasite: 12,
    yatak_odasi: 0,
    banyo: 1,
    ozellikler: ["motoryat", "kaptan_dahil", "yemek_dahil", "snorkel", "gunluk", "klima"],
    gorseller: [
      "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80",
      "https://images.unsplash.com/photo-1520674816852-d5f9e9d63773?w=800&q=80",
    ],
  },
  {
    baslik: "Ölüdeniz Yelkenli — Haftalık Kiralama",
    aciklama:
      "Ölüdeniz'den kalkan bu modern yelkenli ile Akdeniz'in en güzel koylarını keşfedin. Beler, Gemiler Adası ve Göcek adaları rotasında haftalık mavi yolculuk.",
    konum: "Ölüdeniz, Fethiye",
    gunluk_fiyat: 5500,
    kapasite: 6,
    yatak_odasi: 3,
    banyo: 1,
    ozellikler: ["yelkenli", "kaptan_dahil", "wifi", "snorkel", "kayak", "haftalik", "klima"],
    gorseller: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
      "https://images.unsplash.com/photo-1475776408506-9a5371e7a068?w=800&q=80",
    ],
  },
  {
    baslik: "Göcek 12 Kişilik Lüks Gulet",
    aciklama:
      "Göcek Limanı'ndan hareket eden bu lüks ahşap gulet, 6 kabin ve 3 banyosuyla büyük gruplar için ideal. Profesyonel şef, kaptan ve 2 mürettebat eşliğinde VIP mavi yolculuk deneyimi.",
    konum: "Göcek, Fethiye",
    gunluk_fiyat: 8500,
    kapasite: 12,
    yatak_odasi: 6,
    banyo: 3,
    ozellikler: ["gulet", "kaptan_dahil", "murettebat_dahil", "wifi", "klima", "jakuzi", "snorkel", "kayak", "haftalik", "gunluk"],
    gorseller: [
      "https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=800&q=80",
      "https://images.unsplash.com/photo-1493244040629-496f6d136cc4?w=800&q=80",
    ],
  },
  {
    baslik: "Fethiye Katamaran — Günlük Ada Turu",
    aciklama:
      "İki tekneyle çift gövdeli konstrüksiyonu sayesinde son derece stabil seyir sunan katamaran, Fethiye körfezi adaları turuna çıkıyor. Geniş güverte alanı ve sosyal havuzuyla aile ve gruplar için ideal.",
    konum: "Fethiye Merkez",
    gunluk_fiyat: 5800,
    kapasite: 10,
    yatak_odasi: 4,
    banyo: 2,
    ozellikler: ["katamaran", "kaptan_dahil", "wifi", "snorkel", "yemek_dahil", "gunluk", "klima"],
    gorseller: [
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=80",
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
    ],
  },
  {
    baslik: "Çalış Sürat Teknesi — Saatlik Kiralama",
    aciklama:
      "Çalış Plajı önünden kalkış yapan bu hızlı sürat teknesi, 4 kişiye kadar özel turlar sunuyor. Ölüdeniz lagününe hızlı geçiş veya balık tutma turları için ideal seçenek.",
    konum: "Çalış, Fethiye",
    gunluk_fiyat: 1800,
    kapasite: 4,
    yatak_odasi: 0,
    banyo: 0,
    ozellikler: ["surat", "kaptan_dahil", "snorkel", "gunluk", "balik_tutma"],
    gorseller: [
      "https://images.unsplash.com/photo-1521640835947-234ea55b6978?w=800&q=80",
      "https://images.unsplash.com/photo-1503249023995-51b0f3778ccf?w=800&q=80",
    ],
  },
  {
    baslik: "Göcek Koy Turu — Özel Tekne",
    aciklama:
      "Göcek'in eşsiz 12 adasını ve gizli koylarını keşfetmek için özel tekne turu. Shallows Bay, Bedri Rahmi Koyu ve Tersane Adası'nı kapsayan tam gün program. Kaptan ve atıştırmalıklar dahil.",
    konum: "Göcek, Fethiye",
    gunluk_fiyat: 2800,
    kapasite: 8,
    yatak_odasi: 0,
    banyo: 1,
    ozellikler: ["motoryat", "kaptan_dahil", "snorkel", "yiyecek_dahil", "gunluk"],
    gorseller: [
      "https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?w=800&q=80",
      "https://images.unsplash.com/photo-1516939884455-1445c8652f83?w=800&q=80",
    ],
  },
  {
    baslik: "Fethiye Lüks Motoryat — 3 Günlük",
    aciklama:
      "Fethiye'nin en prestijli tekne kiralama seçeneği. 15 metrelik bu lüks motoryat, 3 günlük Göcek-Marmaris rotasında özel deniz tatili sunuyor. Kaptan, aşçı ve hizmetçi dahil.",
    konum: "Fethiye Merkez",
    gunluk_fiyat: 12000,
    kapasite: 8,
    yatak_odasi: 4,
    banyo: 3,
    ozellikler: ["motoryat", "kaptan_dahil", "murettebat_dahil", "wifi", "klima", "jakuzi", "yemek_dahil", "gunluk", "haftalik"],
    gorseller: [
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=800&q=80",
      "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&q=80",
    ],
  },
  {
    baslik: "Ölüdeniz Kano ve Tekne Turu",
    aciklama:
      "Sabah kano turu ve öğleden sonra tekne gezisini birleştiren bu benzersiz paket, Ölüdeniz'in hem karasını hem denizini keşfetmenizi sağlıyor. Rehber eşliğinde macera dolu bir gün.",
    konum: "Ölüdeniz, Fethiye",
    gunluk_fiyat: 1500,
    kapasite: 6,
    yatak_odasi: 0,
    banyo: 0,
    ozellikler: ["surat", "rehber_dahil", "snorkel", "kayak", "yiyecek_dahil", "gunluk"],
    gorseller: [
      "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800&q=80",
      "https://images.unsplash.com/photo-1527004013197-933b162f4a30?w=800&q=80",
    ],
  },
  {
    baslik: "Fethiye Balık Tutma Turu",
    aciklama:
      "Deneyimli kaptan eşliğinde Fethiye körfezinin en verimli balık avı noktalarına yolculuk. Tüm ekipmanlar dahil, yakalanan balıkları akşam restoranımızda pişirtebilirsiniz.",
    konum: "Fethiye Merkez",
    gunluk_fiyat: 2200,
    kapasite: 6,
    yatak_odasi: 0,
    banyo: 0,
    ozellikler: ["surat", "kaptan_dahil", "balik_tutma", "ekipman_dahil", "gunluk"],
    gorseller: [
      "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800&q=80",
      "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&q=80",
    ],
  },
];

async function main() {
  const sahipId = "bfa2bb60-f5fd-48ba-9021-1e649541aca9";

  for (const tekne of tekneler) {
    const slug = slugify(tekne.baslik);

    const { data: yeniIlan, error } = await supabase
      .from("ilanlar")
      .insert({
        sahip_id: sahipId,
        tip: "tekne",
        baslik: tekne.baslik,
        aciklama: tekne.aciklama,
        konum: tekne.konum,
        gunluk_fiyat: tekne.gunluk_fiyat,
        kapasite: tekne.kapasite,
        yatak_odasi: tekne.yatak_odasi,
        banyo: tekne.banyo,
        ozellikler: tekne.ozellikler,
        aktif: true,
        sponsorlu: false,
        slug,
        old_slug: slug,
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ ${tekne.baslik}:`, error.message);
      continue;
    }

    if (yeniIlan) {
      for (let i = 0; i < tekne.gorseller.length; i += 1) {
        await supabase.from("ilan_medyalari").insert({
          ilan_id: yeniIlan.id,
          url: tekne.gorseller[i],
          sira: i + 1,
          tip: "resim",
        });
      }
      console.log(`✅ ${tekne.baslik}`);
    }
  }
  console.log("🎉 10 tekne ilanı eklendi!");
}

void main();
