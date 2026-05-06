import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getHomeFeaturedPackages,
  getPublicCatalogCounts,
  getTopComments,
} from "@/lib/data/phase2";
import type { Ilan } from "@/types/supabase";
import { WaveDivider } from "@/components/wave-divider";
import { HomeHeroStacked } from "@/components/home-hero-stacked";
import { HomeStatsBand } from "@/components/home-stats-band";
import { MotionFadeIn } from "@/components/motion-fade-in";
import { HomeKategoriFiltre } from "@/components/HomeKategoriFiltre";
import { HomePaketFiltreler } from "@/components/HomePaketFiltreler";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import { getPlatformSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing-card";
import {
  Anchor,
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle,
  Home as HomeIcon,
  Lock,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

type ListingRow = Ilan & { ilan_medyalari?: Array<{ url: string; sira: number }> | null };

function withCoverImage(rows: ListingRow[]): Ilan[] {
  return rows.map((row) => {
    const medyaKapak =
      row.ilan_medyalari && row.ilan_medyalari.length
        ? [...row.ilan_medyalari].sort((a, b) => a.sira - b.sira)[0]?.url ?? null
        : null;
    return {
      ...row,
      ilk_resim_url: row.ilk_resim_url ?? medyaKapak ?? null,
    };
  });
}

function yorumAvatarHarf(ad: string | null): string {
  const t = ad?.trim();
  if (!t) return "M";
  const parcalar = t.split(/\s+/).filter(Boolean);
  if (parcalar.length >= 2) {
    const a = parcalar[0][0];
    const b = parcalar[parcalar.length - 1][0];
    if (a && b) return (a + b).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

export default async function Home() {
  const [homePackages, topComments, settings, catalogCounts, supabase] = await Promise.all([
    getHomeFeaturedPackages(3),
    getTopComments(),
    getPlatformSettings(),
    getPublicCatalogCounts(),
    createClient(),
  ]);
  const [ilanCountRes, tekneCountRes, rezervasyonCountRes] = await Promise.all([
    supabase.from("ilanlar").select("*", { count: "exact", head: true }).eq("aktif", true).eq("tip", "villa"),
    supabase.from("ilanlar").select("*", { count: "exact", head: true }).eq("aktif", true).eq("tip", "tekne"),
    supabase.from("rezervasyonlar").select("*", { count: "exact", head: true }),
  ]);
  const { data: oneIlanlarRaw } = await supabase
    .from("ilanlar")
    .select("*, ilan_medyalari(url,sira)")
    .eq("aktif", true)
    .eq("tip", "villa")
    .order("olusturulma_tarihi", { ascending: false })
    .limit(4);
  const oneIlanlar = withCoverImage((oneIlanlarRaw ?? []) as ListingRow[]);
  const statsCounts = {
    rezervasyon: rezervasyonCountRes.count ?? catalogCounts?.rezervasyonCount ?? 0,
    villa: ilanCountRes.count ?? catalogCounts?.villaCount ?? 0,
    tekne: tekneCountRes.count ?? catalogCounts?.tekneCount ?? 0,
  };

  const holidayCategoryItems = [
    {
      title: "Macera",
      subtitle: "Doğayla iç içe tatil",
      href: "/konaklama?kategori=macera",
      image:
        "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80",
      icon: "mountain" as const,
    },
    {
      title: "Lüks",
      subtitle: "Konforun zirvesi",
      href: "/konaklama?kategori=luks",
      image:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
      icon: "award" as const,
    },
    {
      title: "Romantik",
      subtitle: "Unutulmaz kaçamak",
      href: "/konaklama?kategori=romantik",
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
      icon: "star" as const,
    },
    {
      title: "Aile",
      subtitle: "Herkes için eğlence",
      href: "/konaklama?kategori=aile",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      icon: "users" as const,
    },
  ];
  const homeStats = [
    {
      num: String(statsCounts.rezervasyon),
      label: "Mutlu Misafir",
      icon: <Users className="h-5 w-5 text-[#22d3ee]" />,
    },
    {
      num: String(statsCounts.villa),
      label: "Onaylı Villa",
      icon: <HomeIcon className="h-5 w-5 text-[#22d3ee]" />,
    },
    {
      num: String(statsCounts.tekne),
      label: "Özel Tekne",
      icon: <Anchor className="h-5 w-5 text-[#22d3ee]" />,
    },
    {
      num: catalogCounts?.averageRating ?? "5.0",
      label: "Ortalama Puan",
      icon: <Star className="h-5 w-5 text-amber-400" />,
    },
    { num: "TURSAB", label: "Güvenceli", icon: <ShieldCheck className="h-5 w-5 text-green-500" /> },
  ] as const;
  const regionShowcase = [
    {
      slug: "ölüdeniz",
      isim: "Ölüdeniz",
      ilanSayisi: "25+",
      gorsel:
        "https://images.unsplash.com/photo-1590076082698-6d12b8909d9b?auto=format&fit=crop&w=900&q=80",
    },
    {
      slug: "çalış",
      isim: "Çalış",
      ilanSayisi: "18+",
      gorsel:
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80",
    },
    {
      slug: "göcek",
      isim: "Göcek",
      ilanSayisi: "12+",
      gorsel:
        "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=80",
    },
    {
      slug: "hisarönü",
      isim: "Hisarönü",
      ilanSayisi: "15+",
      gorsel:
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=900&q=80",
    },
    {
      slug: "kayaköy",
      isim: "Kayaköy",
      ilanSayisi: "10+",
      gorsel:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
    },
    {
      slug: "fethiye merkez",
      isim: "Fethiye Merkez",
      ilanSayisi: "20+",
      gorsel:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="flex w-full flex-col overflow-x-hidden">
      <div className="hero-video-section relative overflow-visible border-b border-[#0e9aa7]/20 bg-gradient-to-r from-[#0e9aa7] to-[#06b6d4] py-2.5 text-sm font-medium text-white">
        <div className="pointer-events-none absolute -left-16 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-[#22d3ee]/20 blur-2xl" />
        <div className="pointer-events-none absolute -right-20 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-[#0e9aa7]/30 blur-2xl" />
        <div className="flex w-full flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-3 text-center sm:justify-start sm:text-left">
            <span className="text-xl" aria-hidden>
              🏖️
            </span>
            <span className="font-semibold">2026 Yaz Sezonu Erken Rezervasyon Başladı!</span>
            <span className="text-sm text-[#e2e8f0]/80 md:inline">
              — Haziran öncesi rezervasyonlarda %15&apos;e kadar indirim
            </span>
          </div>
          <Link
            href="/konaklama"
            className="shrink-0 rounded-full border border-[#22d3ee]/40 bg-[#22d3ee]/15 px-4 py-1 text-sm font-medium text-[#22d3ee] transition-all hover:bg-[#22d3ee]/25"
          >
            İncele →
          </Link>
        </div>
        <button
          type="button"
          aria-label="Duyuruyu kapat"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#e2e8f0]/80 transition-colors hover:text-[#e2e8f0]"
        >
          ×
        </button>
      </div>
      <HomeHeroStacked />

      <HomeStatsBand items={[...homeStats]} />

      <section className="-mx-4 bg-gradient-to-b from-white to-[#f0fdfd] py-10 sm:py-12 md:py-16 md:-mx-6 lg:-mx-8">
        <MotionFadeIn className="w-full">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <span className="mb-4 inline-block rounded-full bg-[#0e9aa7]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#0e9aa7]">
                Neden Sezondakirala?
              </span>
              <h2 className="mb-3 text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">Güvenli, Şeffaf, Profesyonel</h2>
              <p className="mx-auto max-w-xl text-lg text-slate-500">
                Her rezervasyonunuzda arkanızda olduğumuzu bilmenizi istiyoruz.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg after:absolute after:-right-8 after:-top-8 after:h-32 after:w-32 after:rounded-full after:bg-[#0e9aa7]/5 after:transition-transform after:duration-500 hover:after:scale-150">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0e9aa7] to-[#06b6d4] shadow-lg shadow-[#0e9aa7]/25">
                  <Lock className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-800">SSL Güvenli Ödeme</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  256-bit SSL şifreleme ile tüm ödeme işlemleriniz tam güvence altında gerçekleşir.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#0e9aa7]">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Banka düzeyinde güvenlik
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg after:absolute after:-right-8 after:-top-8 after:h-32 after:w-32 after:rounded-full after:bg-[#0e9aa7]/5 after:transition-transform after:duration-500 hover:after:scale-150">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                  <BadgeCheck className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-800">Admin Onaylı İlanlar</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Yayına giren her ilan ekibimiz tarafından tek tek incelenir, doğrulanır ve onaylanır.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Sahte ilan sıfır tolerans
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg after:absolute after:-right-8 after:-top-8 after:h-32 after:w-32 after:rounded-full after:bg-[#0e9aa7]/5 after:transition-transform after:duration-500 hover:after:scale-150">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                  <MessageCircle className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-800">7/24 Canlı Destek</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Rezervasyon öncesi, sırası ve sonrasında WhatsApp ve telefon ile her an yanınızdayız.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Ortalama yanıt 10 dakika
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg after:absolute after:-right-8 after:-top-8 after:h-32 after:w-32 after:rounded-full after:bg-[#0e9aa7]/5 after:transition-transform after:duration-500 hover:after:scale-150">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                  <Award className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-800">TURSAB Lisanslı</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Türkiye Seyahat Acentaları Birliği onaylı lisanslı platform. Belge No: {settings.tursabNo}.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Resmi devlet güvencesi
                </div>
              </div>
            </div>
          </div>
        </MotionFadeIn>
      </section>

      <section className="-mx-4 bg-[#f0fdfd] py-10 sm:py-12 md:py-16 md:-mx-6 lg:-mx-8">
        <MotionFadeIn className="w-full space-y-5" delay={0.05}>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">Hazır Tatil Paketleri</h2>
            <p className="mt-1 text-base leading-relaxed text-slate-500">Konaklama + aktivite bir arada — örnek paketler</p>
          </div>
          <HomePaketFiltreler paketler={homePackages.slice(0, 3)} />
          <div className="flex justify-center pt-8">
            <Link
              href="/paketler"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#0e9aa7] px-8 py-3 text-sm font-semibold text-[#0e9aa7] transition-all duration-200 hover:bg-[#0e9aa7] hover:text-[#0d1117] hover:shadow-md active:scale-[0.98]"
            >
              Tümünü gör
            </Link>
          </div>
        </MotionFadeIn>
      </section>

      <section className="-mx-4 bg-white py-16 md:-mx-6 lg:-mx-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#0e9aa7]">
                Yeni Eklendi
              </span>
              <h2 className="text-3xl font-bold text-slate-900">Öne Çıkan Villalar</h2>
            </div>
            <Link href="/konaklama" className="flex items-center gap-1 text-sm font-semibold text-[#0e9aa7] hover:underline">
              Tümünü gör <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(oneIlanlar ?? []).map((ilan) => (
              <ListingCard key={ilan.id} listing={ilan} showWhatsappCta={false} />
            ))}
          </div>
        </div>
      </section>

      <section className="-mx-4 bg-white py-10 sm:py-12 md:py-16 md:-mx-6 lg:-mx-8">
        <MotionFadeIn className="w-full space-y-6" delay={0.1}>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">Ne Tür Tatil İstiyorsunuz?</h2>
            <p className="mx-auto max-w-xl text-center text-lg text-slate-500">İhtiyacınıza özel seçenekler</p>
          </div>
          <HomeKategoriFiltre items={holidayCategoryItems} />
        </MotionFadeIn>
      </section>

      <section className="-mx-4 bg-[#f0fdfd] py-10 sm:py-12 md:py-16 md:-mx-6 lg:-mx-8">
        <MotionFadeIn className="mx-auto max-w-4xl space-y-4 px-4 text-center" delay={0.2}>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">3 Adımda Tatil Rezervasyonu</h2>
          <p className="text-slate-500">Hızlı, güvenli ve kolay</p>
          <div className="grid grid-cols-1 gap-4 pt-6 sm:gap-6 md:grid-cols-3 md:gap-8">
            {[
              { no: "01", baslik: "Ara & Seç", aciklama: "Tarih ve kişi sayısı girin, filtreleyin." },
              { no: "02", baslik: "Rezervasyon Yap", aciklama: "Online güvenli ödeme, anında onay." },
              { no: "03", baslik: "Tatil Keyfi", aciklama: "Biz hallederiz, siz eğlenin." },
            ].map((item) => (
              <article key={item.no} className="relative">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0e9aa7] to-[#06b6d4] shadow-lg shadow-[#0e9aa7]/25">
                  <span className="text-2xl font-black text-white">{item.no}</span>
                </div>
                <h3 className="mb-2 mt-4 text-xl font-semibold text-slate-800">{item.baslik}</h3>
                <p className="leading-relaxed text-slate-500">{item.aciklama}</p>
              </article>
            ))}
          </div>
        </MotionFadeIn>
      </section>

      <section className="-mx-4 bg-white py-10 sm:py-12 md:py-16 md:-mx-6 lg:-mx-8">
        <MotionFadeIn className="w-full space-y-4" delay={0.25}>
          <div className="mb-12 text-center">
            <h2 className="heading-section mb-3 text-slate-900">Misafirlerimiz Ne Diyor?</h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={20} className="fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 font-bold text-slate-800">4.9/5</span>
              <span className="text-slate-500">— 120+ değerlendirme</span>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {topComments.map((item) => (
              <article key={item.id} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <div
                  className="pointer-events-none absolute right-6 top-4 select-none font-serif text-8xl leading-none text-[#0e9aa7]/20"
                  aria-hidden
                >
                  &ldquo;
                </div>
                <div className="mb-3 flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i <= item.puan ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      }
                    />
                  ))}
                </div>
                <p className="relative z-10 mb-4 leading-relaxed text-slate-600">
                  &ldquo;{fixTurkishDisplay(item.yorum)}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0e9aa7] text-sm font-bold text-white">
                    {yorumAvatarHarf(item.misafir_ad)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {item.misafir_ad ? fixTurkishDisplay(item.misafir_ad) : "Misafir"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.ilan_baslik ? fixTurkishDisplay(item.ilan_baslik) : SITE_NAME}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </MotionFadeIn>
      </section>

      <section className="-mx-4 bg-gradient-to-b from-[#0f4c5c]/20 to-[#111827] py-10 sm:py-12 md:py-16 text-[#e2e8f0] md:-mx-6 lg:-mx-8">
        <MotionFadeIn className="w-full" delay={0.3}>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-[#e2e8f0] sm:text-3xl md:text-4xl">Fethiye&apos;yi Keşfedin</h2>
            <p className="mx-auto max-w-2xl text-lg text-[#94a3b8]">
              Eşsiz güzellikleriyle her bölge farklı bir tatil vaat ediyor
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {regionShowcase.map((bolge) => (
              <Link
                key={bolge.slug}
                href={`/konaklama?konum=${encodeURIComponent(bolge.slug)}`}
                className="group relative aspect-[5/4] cursor-pointer overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-105"
              >
                <Image
                  src={bolge.gorsel}
                  alt={bolge.isim}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-all hover:from-black/40" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-lg font-bold text-white">{bolge.isim}</div>
                  <div className="text-sm text-white/70">{bolge.ilanSayisi} villa</div>
                </div>
                <div className="absolute inset-0 bg-[#0e9aa7]/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-[#e2e8f0] px-4 py-2 text-sm font-semibold text-[#0d1117]">
                    Villaları Gör →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </MotionFadeIn>
      </section>

      <section className="-mx-4 bg-[#f0fdfd] py-10 sm:py-12 md:py-16 md:-mx-6 lg:-mx-8">
        <MotionFadeIn className="text-slate-800" delay={0.35}>
          <div className="w-full text-center">
            <h2 className="heading-section text-slate-900">Hayalinizdeki Tatili Bulmaya Hazır mısınız?</h2>
            <p className="mt-2 text-slate-500">Fethiye&apos;nin en seçkin villaları sizi bekliyor.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/konaklama"
                className="rounded-xl bg-gradient-to-r from-[#0e9aa7] to-[#22d3ee] px-5 py-3 text-sm font-bold text-[#0d1117] shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Hemen Rezervasyon Yap
              </Link>
              <Link
                href={`https://wa.me/${settings.whatsappNumber}`}
                className="rounded-xl border border-[#0e9aa7]/40 px-5 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-[#0e9aa7]/15 hover:text-[#0e9aa7] hover:shadow-md active:scale-[0.98]"
              >
                WhatsApp ile Bilgi Al
              </Link>
            </div>
          </div>
        </MotionFadeIn>
      </section>
      <WaveDivider color="#0F172A" flip />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL.replace(/\/$/, "")}/konaklama?konum={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            name: SITE_NAME,
            description: "Fethiye'de villa ve tekne kiralama platformu",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Fethiye",
            },
          }),
        }}
      />
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Fethiye Villa ve Tekne Kiralama | ${SITE_NAME} — TURSAB Onaylı`,
    description: "Fethiye'de villa ve tekne kiralama seçenekleriyle tatilinizi planlayın.",
    openGraph: {
      title: `Fethiye Villa ve Tekne Kiralama | ${SITE_NAME} — TURSAB Onaylı`,
      description: "Fethiye'de villa ve tekne kiralama seçenekleriyle tatilinizi planlayın.",
      images: ["/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `Fethiye Villa ve Tekne Kiralama | ${SITE_NAME} — TURSAB Onaylı`,
      description: "Fethiye'de villa ve tekne kiralama seçenekleriyle tatilinizi planlayın.",
      images: ["/og-image.jpg"],
    },
  };
}
