import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageListingHero } from "@/components/page-listing-hero";
import { getPlatformSettings } from "@/lib/settings";
import { SITE_NAME, TURSAB_NO, whatsappHref } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const HERO_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80";
const ekip = [
  { ad: "Muratcan", unvan: "Kurucu & CEO", avatar: "M", detay: "Operasyon, ürün ve partner yönetimi" },
  { ad: "Destek Ekibi", unvan: "Müşteri Hizmetleri", avatar: "D", detay: "Rezervasyon öncesi ve sonrası 7/24 destek" },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Hakkımızda",
    description: `${SITE_NAME} ekibini ve güven yaklaşımımızı tanıyın.`,
    openGraph: {
      title: "Hakkımızda",
      description: `${SITE_NAME} ekibini ve güven yaklaşımımızı tanıyın.`,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function AboutPage() {
  const [settings, supabase] = await Promise.all([getPlatformSettings(), createClient()]);
  const wa = whatsappHref(settings.whatsappNumber);
  const [rezervasyonRes, ilanRes, kullaniciRes] = await Promise.all([
    supabase.from("rezervasyonlar").select("*", { count: "exact", head: true }),
    supabase.from("ilanlar").select("*", { count: "exact", head: true }).eq("aktif", true),
    supabase.from("kullanicilar").select("*", { count: "exact", head: true }),
  ]);

  const rezervasyonCount = rezervasyonRes.count ?? 0;
  const ilanCount = ilanRes.count ?? 0;
  const kullaniciCount = kullaniciRes.count ?? 0;
  const gucluIstatistik = rezervasyonCount >= 20 || ilanCount >= 20 || kullaniciCount >= 50;

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <PageListingHero
        breadcrumbCurrent="Hakkımızda"
        title="Hakkımızda"
        subtitle="Fethiye&apos;nin güvenilir villa ve tekne kiralama platformu."
      />
      <section className="relative h-48 md:h-72">
        <Image src={HERO_IMG} alt="Fethiye" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-black/40" aria-hidden />
      </section>

      <section className="mx-auto max-w-6xl bg-[#f0fdfd] px-4 py-10 sm:px-6 sm:py-12 md:py-16">
        <div className="grid items-center gap-6 sm:gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">Hikayemiz</h2>
            <p className="mb-4 leading-relaxed text-slate-500">
              {SITE_NAME}, Fethiye&apos;nin eşsiz güzelliklerini her tatilciyle buluşturma hayaliyle
              kuruldu. Villa ve tekne kiralama sürecini şeffaf, güvenli ve kolay hale getirmek için
              çalışıyoruz.
            </p>
            <p className="leading-relaxed text-slate-500">
              TURSAB çatısı altında lisanslı bir platform olarak, hem ilan sahiplerine hem de
              tatilcilere en iyi deneyimi sunmayı hedefliyoruz.
            </p>
          </div>
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
            {[
              { label: "Doğrulanan rezervasyon", value: `${rezervasyonCount}+` },
              { label: "Aktif ilan", value: `${ilanCount}+` },
              { label: "Ortalama destek yanıtı", value: "< 10 dk" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-[#f0fdfd] p-4 sm:p-6 md:p-8 text-center shadow-sm transition-shadow hover:shadow-md">
                <p className="text-2xl font-bold text-[#0e9aa7]">{item.value}</p>
                <p className="text-sm text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {gucluIstatistik ? (
        <section className="bg-white py-10 sm:py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 text-center lg:grid-cols-4 lg:gap-8">
              {[
                { num: `${rezervasyonCount}+`, label: "Tamamlanan Rezervasyon" },
                { num: `${ilanCount}+`, label: "Aktif İlan" },
                { num: `${kullaniciCount}+`, label: "Kayıtlı Kullanıcı" },
                { num: "%98", label: "Memnuniyet Oranı" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-[#0e9aa7] sm:text-3xl md:text-4xl">{num}</div>
                  <div className="mt-1 text-sm text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white py-10 sm:py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <p className="text-lg font-semibold text-slate-800">Büyüyen bir platformuz</p>
            <p className="mt-2 text-slate-500">
              Her geçen gün yeni ilan sahipleri ve tatilcilerle büyüyoruz. İlk günden beri şeffaf ve güvenli
              rezervasyon deneyimine odaklanıyoruz.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="flex flex-col items-center gap-4 sm:gap-6 rounded-2xl border border-slate-200 bg-[#f0fdfd] p-4 sm:p-6 md:p-8 md:flex-row">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#0e9aa7]/20 text-4xl">
            🏆
          </div>
          <div>
            <h3 className="mb-2 text-xl font-bold text-[#0e9aa7]">TURSAB Güvencesi</h3>
            <p className="text-slate-500">
              {SITE_NAME}, Türkiye Seyahat Acenteleri Birliği (TURSAB) üyesidir. Belge No:{" "}
              {TURSAB_NO} ile tüm işlemleriniz yasal güvence altındadır.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 sm:pb-12 md:pb-16">
        <h2 className="mb-6 text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">Ekibimiz</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {ekip.map((kisi) => (
            <div key={kisi.ad} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0e9aa7]/20 to-[#06b6d4]/20 font-bold text-[#0e9aa7]">
                {kisi.avatar}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{kisi.ad}</p>
                <p className="text-sm text-slate-500">{kisi.unvan}</p>
                <p className="mt-1 text-xs text-slate-500">{kisi.detay}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#0f4c5c] via-[#0e9aa7] to-[#4a7c7e] py-10 sm:py-12 md:py-16 text-center text-white">
        <h2 className="mb-4 text-xl font-bold sm:text-2xl md:text-3xl">Sorularınız İçin Bize Ulaşın</h2>
        <p className="mb-8 text-[#e2e8f0]/90">7/24 WhatsApp desteğimizle yanınızdayız</p>
        <Link
          href={wa}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0e9aa7] to-[#22d3ee] px-8 py-4 font-bold text-[#0d1117] shadow-lg transition hover:scale-[1.02]"
        >
          WhatsApp ile İletişim Kur
        </Link>
      </section>
    </div>
  );
}
