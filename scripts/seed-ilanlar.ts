import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

type SeedIlan = {
  baslik: string;
  aciklama: string;
  konum: string;
  gunluk_fiyat: number;
  temizlik_ucreti: number;
  kapasite: number;
  yatak_odasi: number;
  banyo: number;
  ozellikler: string[];
  kategori: "macera" | "luks" | "romantik" | "aile";
  gorsel: string;
};

const slugify = (text: string) =>
  text
    .split("")
    .map(
      (c) =>
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
        )[c] ?? c
    )
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const ilanlar: SeedIlan[] = [
  {
    baslik: "Kayakoy Doga Icinde Tas Villa",
    aciklama:
      "Tarihi Kayakoyun hemen yani basinda, dogayla ic ice ozel tas villa. Likya yolu baslangic noktasina 5 dakika yurume mesafesinde.",
    konum: "Kayakoy, Fethiye",
    gunluk_fiyat: 2800,
    temizlik_ucreti: 350,
    kapasite: 8,
    yatak_odasi: 4,
    banyo: 2,
    ozellikler: ["wifi", "bbq", "bahce", "dogal_havuz", "klima", "macera"],
    kategori: "macera",
    gorsel: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  },
  {
    baslik: "Oludeniz Yamac Doga Villasi",
    aciklama:
      "Oludenize hakim yamacta konumlanan bu villa, parasutculerin inis noktasina yakinligiyla macera severlerin gozdesi.",
    konum: "Oludeniz, Fethiye",
    gunluk_fiyat: 3200,
    temizlik_ucreti: 400,
    kapasite: 6,
    yatak_odasi: 3,
    banyo: 2,
    ozellikler: ["wifi", "havuz", "klima", "deniz_manzarasi", "bbq", "macera"],
    kategori: "macera",
    gorsel: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
  },
  {
    baslik: "Gocek Orman Ici Ahsap Villa",
    aciklama:
      "Gocekin sik cam ormanlari icinde sakli, tamamen ahsap yapida doga tutkunlari icin ideal bir villa.",
    konum: "Gocek, Fethiye",
    gunluk_fiyat: 2400,
    temizlik_ucreti: 300,
    kapasite: 6,
    yatak_odasi: 3,
    banyo: 2,
    ozellikler: ["wifi", "bahce", "bbq", "klima", "jakuzi", "macera"],
    kategori: "macera",
    gorsel: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80",
  },
  {
    baslik: "Faralya Ucurum Manzarali Koy Evi",
    aciklama:
      "Kelebekler Vadisine bakan Faralya koyunde, ucurrum kenarinda konumlanan essiz koy evi.",
    konum: "Faralya, Fethiye",
    gunluk_fiyat: 2200,
    temizlik_ucreti: 280,
    kapasite: 4,
    yatak_odasi: 2,
    banyo: 1,
    ozellikler: ["wifi", "bahce", "deniz_manzarasi", "klima", "macera"],
    kategori: "macera",
    gorsel: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  },
  {
    baslik: "Hisaronu Dag Etegi Adventure Villa",
    aciklama:
      "Hisaronunun hareketli merkezine yakin ama sakin bir ortamda, etkinlik rotalarina ulasimli bir villa.",
    konum: "Hisaronu, Fethiye",
    gunluk_fiyat: 2600,
    temizlik_ucreti: 320,
    kapasite: 10,
    yatak_odasi: 5,
    banyo: 3,
    ozellikler: ["wifi", "havuz", "klima", "bbq", "bahce", "tv", "macera"],
    kategori: "macera",
    gorsel: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  },
  {
    baslik: "Gocek Korfezi Sonsuzluk Havuzlu Luks Villa",
    aciklama:
      "Gocek korfezine yakin, sonsuzluk havuzlu bu luks villa unutulmaz bir deneyim sunar.",
    konum: "Gocek, Fethiye",
    gunluk_fiyat: 8500,
    temizlik_ucreti: 800,
    kapasite: 8,
    yatak_odasi: 4,
    banyo: 4,
    ozellikler: ["wifi", "havuz", "klima", "jakuzi", "deniz_manzarasi", "akilli_ev", "bbq", "bahce", "luks"],
    kategori: "luks",
    gorsel: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&q=80",
  },
  {
    baslik: "Oludeniz Panoramik Deniz Manzarali Villa",
    aciklama:
      "Lagune bakan bu villa 360 derece manzarasi, havuzu ve premium konfor detaylariyla one cikar.",
    konum: "Oludeniz, Fethiye",
    gunluk_fiyat: 9200,
    temizlik_ucreti: 900,
    kapasite: 10,
    yatak_odasi: 5,
    banyo: 5,
    ozellikler: ["wifi", "havuz", "klima", "jakuzi", "deniz_manzarasi", "sauna", "akilli_ev", "bahce", "luks"],
    kategori: "luks",
    gorsel: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  },
  {
    baslik: "Calis Plaji Ozel Yuzme Havuzlu Villa",
    aciklama:
      "Calis plajina yurume mesafesinde, genis havuzlu ve kalabalik aile/gruplara uygun premium bir villa.",
    konum: "Calis, Fethiye",
    gunluk_fiyat: 7800,
    temizlik_ucreti: 750,
    kapasite: 12,
    yatak_odasi: 6,
    banyo: 5,
    ozellikler: ["wifi", "havuz", "klima", "jakuzi", "bbq", "bahce", "tv", "akilli_ev", "luks"],
    kategori: "luks",
    gorsel: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800&q=80",
  },
  {
    baslik: "Fethiye Marina Manzarali Ultra Luks Villa",
    aciklama:
      "Fethiye marinasina hakim bu ultra luks villa, rooftop havuz ve modern tasarimiyla dikkat ceker.",
    konum: "Fethiye Merkez",
    gunluk_fiyat: 12000,
    temizlik_ucreti: 1200,
    kapasite: 8,
    yatak_odasi: 4,
    banyo: 4,
    ozellikler: ["wifi", "havuz", "klima", "jakuzi", "deniz_manzarasi", "sauna", "akilli_ev", "bbq", "luks"],
    kategori: "luks",
    gorsel: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  },
  {
    baslik: "Hisaronu Isitmali Havuzlu Spa Villa",
    aciklama:
      "Dort mevsim kullanima uygun isitma havuzu ve spa odakli yasam alani sunan luks villa.",
    konum: "Hisaronu, Fethiye",
    gunluk_fiyat: 6500,
    temizlik_ucreti: 650,
    kapasite: 8,
    yatak_odasi: 4,
    banyo: 3,
    ozellikler: ["wifi", "havuz", "klima", "jakuzi", "sauna", "bbq", "bahce", "akilli_ev", "luks"],
    kategori: "luks",
    gorsel: "https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=800&q=80",
  },
  {
    baslik: "Calis Plaji Balayi Villasi",
    aciklama:
      "Balayi ciftleri icin ozel tasarlanan, denize yakin konumlu, romantik detaylara sahip butik villa.",
    konum: "Calis, Fethiye",
    gunluk_fiyat: 4500,
    temizlik_ucreti: 500,
    kapasite: 2,
    yatak_odasi: 1,
    banyo: 1,
    ozellikler: ["wifi", "jakuzi", "klima", "deniz_manzarasi", "ozel_havuz", "bahce", "romantik"],
    kategori: "romantik",
    gorsel: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  },
  {
    baslik: "Gocek Gun Batimi Romantik Kacamak",
    aciklama:
      "Gocek korfezine hakim tepede, ciftlere ozel teraslari ve manzarasiyla sakin bir kacamak sunar.",
    konum: "Gocek, Fethiye",
    gunluk_fiyat: 3800,
    temizlik_ucreti: 450,
    kapasite: 2,
    yatak_odasi: 1,
    banyo: 1,
    ozellikler: ["wifi", "havuz", "jakuzi", "klima", "deniz_manzarasi", "bbq", "romantik"],
    kategori: "romantik",
    gorsel: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  },
  {
    baslik: "Oludeniz Lagun Manzarali Cift Villasi",
    aciklama:
      "Oludeniz lagun manzarali, ozel bahceli ve ciftlerin sakin tatil beklentisine uygun bir villa.",
    konum: "Oludeniz, Fethiye",
    gunluk_fiyat: 4200,
    temizlik_ucreti: 480,
    kapasite: 2,
    yatak_odasi: 1,
    banyo: 1,
    ozellikler: ["wifi", "havuz", "jakuzi", "klima", "deniz_manzarasi", "bahce", "romantik"],
    kategori: "romantik",
    gorsel: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  },
  {
    baslik: "Fethiye Tarihi Sehir Manzarali Butik Villa",
    aciklama:
      "Tarihi doku ve modern konforu birlestiren, liman manzarali butik villa.",
    konum: "Fethiye Merkez",
    gunluk_fiyat: 3500,
    temizlik_ucreti: 400,
    kapasite: 4,
    yatak_odasi: 2,
    banyo: 2,
    ozellikler: ["wifi", "klima", "jakuzi", "bahce", "deniz_manzarasi", "romantik"],
    kategori: "romantik",
    gorsel: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  },
  {
    baslik: "Hisaronu Yildiz Altinda Romantik Villa",
    aciklama:
      "Acilir jakuzi alaniyla gece yildiz gozlemi sunan, ciftlerin favori rotalarindan biri.",
    konum: "Hisaronu, Fethiye",
    gunluk_fiyat: 3200,
    temizlik_ucreti: 380,
    kapasite: 4,
    yatak_odasi: 2,
    banyo: 2,
    ozellikler: ["wifi", "havuz", "jakuzi", "klima", "bbq", "bahce", "romantik"],
    kategori: "romantik",
    gorsel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  },
  {
    baslik: "Fethiye Marina Yakini Buyuk Aile Villasi",
    aciklama:
      "Geni aile gruplari icin ideal, cok odali, cocuk oyun alanli ve havuzlu villa.",
    konum: "Fethiye Merkez",
    gunluk_fiyat: 5500,
    temizlik_ucreti: 600,
    kapasite: 14,
    yatak_odasi: 6,
    banyo: 4,
    ozellikler: ["wifi", "havuz", "klima", "bbq", "bahce", "tv", "cocuk_havuzu", "aile"],
    kategori: "aile",
    gorsel: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  },
  {
    baslik: "Calis Plaji Aile Tatil Villasi",
    aciklama:
      "Cocuk dostu detaylara sahip, plaja yurus mesafesinde aile odakli tatil villasi.",
    konum: "Calis, Fethiye",
    gunluk_fiyat: 4800,
    temizlik_ucreti: 550,
    kapasite: 12,
    yatak_odasi: 5,
    banyo: 3,
    ozellikler: ["wifi", "havuz", "cocuk_havuzu", "klima", "bbq", "bahce", "tv", "aile"],
    kategori: "aile",
    gorsel: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  },
  {
    baslik: "Hisaronu Havuzlu Aile Eglence Merkezi",
    aciklama:
      "Buyuk kapasitesi ve acik hava yasam alaniyla her yastan aile bireyi icin keyifli bir secenek.",
    konum: "Hisaronu, Fethiye",
    gunluk_fiyat: 4200,
    temizlik_ucreti: 500,
    kapasite: 16,
    yatak_odasi: 7,
    banyo: 4,
    ozellikler: ["wifi", "havuz", "klima", "bbq", "bahce", "tv", "cocuk_havuzu", "aile"],
    kategori: "aile",
    gorsel: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
  },
  {
    baslik: "Gocek Koy Manzarali Aile Villasi",
    aciklama:
      "Sakin koy manzarali, genis ortak alanli ve denize erisime yakin aile villasi.",
    konum: "Gocek, Fethiye",
    gunluk_fiyat: 5200,
    temizlik_ucreti: 580,
    kapasite: 12,
    yatak_odasi: 5,
    banyo: 3,
    ozellikler: ["wifi", "havuz", "klima", "bbq", "bahce", "deniz_manzarasi", "iskelesi", "aile"],
    kategori: "aile",
    gorsel: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
  },
  {
    baslik: "Kayakoy Bahceli Buyuk Aile Ciftligi",
    aciklama:
      "Genis bahcesi, doga icindeki atmosferi ve cocuklara uygun acik alanlariyla aile tatili icin ideal.",
    konum: "Kayakoy, Fethiye",
    gunluk_fiyat: 3800,
    temizlik_ucreti: 450,
    kapasite: 14,
    yatak_odasi: 6,
    banyo: 3,
    ozellikler: ["wifi", "havuz", "klima", "bbq", "bahce", "tv", "at_binme", "aile"],
    kategori: "aile",
    gorsel: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
  },
];

const run = async () => {
  const { data: adminUser, error: adminError } = await supabase
    .from("kullanicilar")
    .select("id")
    .eq("rol", "admin")
    .single();

  if (adminError || !adminUser?.id) {
    throw new Error(`Admin kullanıcı bulunamadı: ${adminError?.message ?? "rol=admin yok"}`);
  }

  const sahipId = adminUser.id;
  let basariliIlan = 0;
  let basariliMedya = 0;

  for (const ilan of ilanlar) {
    const slug = slugify(ilan.baslik);
    const uniqueSlug = `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: yeniIlan, error: ilanError } = await supabase
      .from("ilanlar")
      .insert({
        sahip_id: sahipId,
        tip: "villa",
        baslik: ilan.baslik,
        aciklama: ilan.aciklama,
        konum: ilan.konum,
        gunluk_fiyat: ilan.gunluk_fiyat,
        temizlik_ucreti: ilan.temizlik_ucreti,
        kapasite: ilan.kapasite,
        yatak_odasi: ilan.yatak_odasi,
        banyo: ilan.banyo,
        ozellikler: {
          kategori: ilan.kategori,
          etiketler: ilan.ozellikler,
        },
        aktif: true,
        sponsorlu: false,
        slug: uniqueSlug,
        old_slug: uniqueSlug,
      })
      .select("id, baslik")
      .single();

    if (ilanError || !yeniIlan?.id) {
      console.error(`❌ ${ilan.baslik}: ${ilanError?.message ?? "İlan eklenemedi"}`);
      continue;
    }

    basariliIlan += 1;

    const ikinciGorsel = ilan.gorsel.includes("w=800")
      ? ilan.gorsel.replace("w=800", "w=1200")
      : `${ilan.gorsel}&w=1200`;

    const { error: medyaError } = await supabase.from("ilan_medyalari").insert([
      {
        ilan_id: yeniIlan.id,
        url: ilan.gorsel,
        sira: 1,
        tip: "resim",
      },
      {
        ilan_id: yeniIlan.id,
        url: ikinciGorsel,
        sira: 2,
        tip: "resim",
      },
    ]);

    if (medyaError) {
      console.error(`⚠️ ${ilan.baslik} medya eklenemedi: ${medyaError.message}`);
      continue;
    }

    basariliMedya += 2;
    console.log(`✅ ${ilan.baslik} eklendi`);
  }

  console.log(`🎉 Seed tamamlandı: ${basariliIlan} ilan, ${basariliMedya} medya.`);
};

run().catch((error) => {
  console.error("Seed hatası:", error);
  process.exit(1);
});
