import type { Metadata } from "next";
import Link from "next/link";
import {
  CatalogHowItWorks,
  CatalogProseSection,
  CatalogTrustStrip,
} from "@/components/catalog-page-blocks";
import { CatalogHeroWave } from "@/components/catalog-hero-wave";
import { PaketlerAnimatedGrid } from "@/components/paketler-animated-grid";
import { PaketlerCategoryTabs } from "@/components/paketler-category-tabs";
import { formatWhatsappTrDisplay, whatsappHref } from "@/lib/constants";
import { getFeaturedPackages } from "@/lib/data/phase2";

type PackagesPageProps = {
  searchParams: Promise<{ kategori?: string }>;
};

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const params = await searchParams;
  const category = params.kategori ?? "tumu";
  const packages = await getFeaturedPackages(category);
  const paketSayisi = packages.length;

  return (
    <div className="w-full overflow-x-hidden">
      <div
        className="relative overflow-hidden pb-0 text-white"
        style={{
          background: "linear-gradient(135deg, #0f4c5c 0%, #0e9aa7 42%, #185FA5 100%)",
          padding: "28px 0 0",
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-[#22d3ee]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#4a7c7e]/35 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6 md:px-6 md:pb-8">
          <h1 className="max-w-3xl text-3xl font-medium tracking-tight md:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Fethiye tatil paketleri
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-normal leading-relaxed text-white/85 md:text-base">
            Fethiye&apos;nin en özel villa ve tekne deneyimlerini bir arada keşfedin
          </p>
          <p className="mt-2 text-xs text-sky-100/90 md:text-sm">{paketSayisi} paket listeleniyor</p>
        </div>
        <CatalogHeroWave fillBottom="#ffffff" />
      </div>

      <div className="w-full bg-white py-10 md:py-12">
        <div className="w-full space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80">
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4 md:px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#185FA5]">Kategori</p>
            </div>
            <div className="p-4 md:p-6">
              <PaketlerCategoryTabs activeCategory={category} />
            </div>
          </div>

          {packages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
              <div className="mb-3 text-5xl" aria-hidden>
                📦
              </div>
              <h2 className="text-lg font-bold text-slate-800">Bu kategoride henüz paket yok</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Farklı bir kategori seçin veya özel tarih ve bütçe için bizimle iletişime geçin.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/paketler"
                  className="inline-flex rounded-xl border-2 border-[#0e9aa7] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#0e9aa7] transition-all duration-200 hover:bg-[#0e9aa7] hover:text-white hover:shadow-md active:scale-[0.98]"
                >
                  Tüm paketlere dön
                </Link>
                <a
                  href={whatsappHref()}
                  className="inline-flex rounded-xl bg-gradient-to-r from-[#0e9aa7] to-[#22d3ee] px-5 py-2.5 text-sm font-bold text-[#0d1117] shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:from-[#22d3ee] hover:to-[#0e9aa7] active:scale-[0.98]"
                >
                  WhatsApp yaz
                </a>
              </div>
            </div>
          ) : (
            <PaketlerAnimatedGrid packages={packages} />
          )}
        </div>
      </div>

      <div className="w-full border-t border-slate-200 bg-[#f0fdfd]">
        <div className="w-full space-y-8 py-10 md:py-12">
          <CatalogTrustStrip
            items={[
              {
                icon: "🧩",
                title: "Tek fiyat, net kapsam",
                text: "Paket kartlarında süre, kapasite ve fiyat özetini görürsünüz; detay sayfasında içerik netleşir.",
              },
              {
                icon: "🏡",
                title: "Konaklama + rota",
                text: "Villa veya tekne bileşenleri paket içeriğine göre değişir; her paket için ayrı sayfa vardır.",
              },
              {
                icon: "🧭",
                title: "Kategoriyle keşfet",
                text: "Macera, lüks, romantik ve aile sekmeleriyle ilgili paketlere hızlıca geçin.",
              },
              {
                icon: "✅",
                title: "Admin onayı",
                text: "Yayına alınan paketler kontrol edilir; sorularınız için iletişim kanalları açıktır.",
              },
            ]}
          />
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <CatalogProseSection
              eyebrow="Paket tatili nedir?"
              title="Hazır paket mi, özel rota mı — hangisi size uygun?"
            >
              <p>
                Hazır paketler; <strong>konaklama süresi</strong>, <strong>kişi sayısı</strong> ve çoğu
                zaman <strong>deneyim / tur</strong> bileşenlerini tek fiyat çatısında toplar. Böylece
                uçuştan sonra &quot;nereye gidelim?&quot; stresini azaltırsınız.
              </p>
              <p>
                Özel tarih, ekstra gün veya farklı villa-tekne kombinasyonu istiyorsanız{" "}
                <Link href="/iletisim" className="font-semibold text-sky-700 underline-offset-2 hover:underline">
                  iletişim
                </Link>{" "}
                veya{" "}
                <a
                  href={whatsappHref()}
                  className="font-semibold text-sky-700 underline-offset-2 hover:underline"
                >
                  WhatsApp ({formatWhatsappTrDisplay()})
                </a>{" "}
                üzerinden ekibimize yazabilirsiniz.
              </p>
            </CatalogProseSection>
            <CatalogHowItWorks
              title="Paket seçiminde önerilen akış"
              steps={[
                {
                  n: "1",
                  title: "Kategori seç",
                  desc: "Macera / lüks / romantik / aile sekmelerinden size en yakın tonu seçin.",
                },
                {
                  n: "2",
                  title: "Kartları karşılaştır",
                  desc: "Süre, kapasite ve fiyatı yan yana okuyun; detay için pakete tıklayın.",
                },
                {
                  n: "3",
                  title: "Talep ve onay",
                  desc: "Detay sayfasından adımları izleyin; gerekirse ekibimiz rota ve tarihi netleştirir.",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const desc =
    "Fethiye tatil paketleri: macera, lüks, romantik ve aile kategorilerinde hazır kombinasyonları inceleyin; süre, kapasite ve fiyatı karşılaştırıp detay sayfasına geçin.";
  return {
    title: "Fethiye Tatil Paketleri — Macera, Lüks, Romantik, Aile",
    description: desc,
    openGraph: {
      title: "Fethiye Tatil Paketleri — Macera, Lüks, Romantik, Aile",
      description: desc,
      images: ["/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Fethiye Tatil Paketleri — Macera, Lüks, Romantik, Aile",
      description: desc,
      images: ["/og-image.jpg"],
    },
  };
}
