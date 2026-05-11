import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock3,
  Eye,
  Headphones,
  Home,
  MapPin,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { MotionFadeIn } from "@/components/motion-fade-in";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Hakkımızda",
    description: `${SITE_NAME} hakkında bilgi alın.`,
    openGraph: {
      title: "Hakkımızda",
      description: `${SITE_NAME} hakkında bilgi alın.`,
      images: ["/og-image.jpg"],
    },
  };
}

const FALLBACK_ILAN = 31;
const FALLBACK_REZ = 17;

export default async function AboutPage() {
  let ilanCount = FALLBACK_ILAN;
  let rezervasyonCount = FALLBACK_REZ;
  try {
    const supabase = await createClient();
    const [ilanRes, rezervasyonRes] = await Promise.all([
      supabase.from("ilanlar").select("*", { count: "exact", head: true }).eq("aktif", true),
      supabase.from("rezervasyonlar").select("*", { count: "exact", head: true }).eq("durum", "onaylandi"),
    ]);
    if (!ilanRes.error && ilanRes.count != null) ilanCount = ilanRes.count;
    if (!rezervasyonRes.error && rezervasyonRes.count != null) rezervasyonCount = rezervasyonRes.count;
  } catch {
    ilanCount = FALLBACK_ILAN;
    rezervasyonCount = FALLBACK_REZ;
  }
  const valueCards = [
    {
      title: "Güvenli İşlem",
      description: "Ödeme ve rezervasyon adımlarında güvenliği önceliklendiren süreçler uygularız.",
      Icon: Shield,
    },
    {
      title: "Tam Şeffaflık",
      description: "Fiyatlandırma, müsaitlik ve koşulları açık ve anlaşılır şekilde sunarız.",
      Icon: Eye,
    },
    {
      title: "7/24 Destek",
      description: "Rezervasyon öncesi ve sonrası ihtiyaçlarınızda ekibimiz her an ulaşılabilirdir.",
      Icon: Headphones,
    },
    {
      title: "Özenle Seçilmiş İlanlar",
      description: "Yayınlanan ilanları kalite ve güvenlik kriterlerine göre düzenli olarak değerlendiririz.",
      Icon: Home,
    },
    {
      title: "Hızlı Onay",
      description: "Uygun rezervasyon taleplerini kısa sürede işleyerek süreci hızlandırırız.",
      Icon: Clock3,
    },
    {
      title: "Yerel Uzmanlık",
      description: "Fethiye bölgesini iyi bilen ekiplerle doğru lokasyon ve deneyim önerileri sunarız.",
      Icon: MapPin,
    },
  ] as const;

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <section className="-mx-4 bg-[#0F6E56] px-4 py-16 text-white sm:-mx-6 sm:px-6 md:py-20 lg:-mx-8 lg:px-8">
        <MotionFadeIn className="mx-auto max-w-6xl text-center" delay={0.03}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white">
            <MapPin className="h-4 w-4" />
            Fethiye, Muğla
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Fethiye&apos;nin En Güvenilir Kiralama Platformu
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-emerald-50 sm:text-lg">
            Villa ve tekne kiralama sürecini şeffaf, güvenli ve kolay hale getiriyoruz. TURSAB güvencesiyle.
          </p>
        </MotionFadeIn>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 md:py-16">
        <MotionFadeIn className="grid gap-8 md:grid-cols-2 md:items-start" delay={0.08}>
          <div>
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0F6E56]">
              Hikayemiz
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              Fethiye&apos;yi Dünyanın Geri Kalanıyla Buluşturuyoruz
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              {SITE_NAME}, Fethiye&apos;de kaliteli villa ve tekne kiralama deneyimini tek noktadan güvenle sunmak için kuruldu.
              Kuruluş amacımız; ilan sahipleriyle tatilcileri şeffaf, doğrulanabilir ve sorunsuz bir süreçte buluşturmaktır.
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              TURSAB lisanslı bir platform olarak yasal uyumu, güvenli işlem altyapısını ve sürdürülebilir hizmet kalitesini
              merkeze alıyoruz. Misyonumuz, her rezervasyonda güven veren ve tekrar tercih edilen bir standart oluşturmak.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Aktif ilan", value: `${ilanCount}+` },
              { label: "Tamamlanan rezervasyon", value: `${rezervasyonCount}+` },
              { label: "Müşteri desteği", value: "7/24" },
              { label: "Memnuniyet oranı", value: "%98" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 h-[3px] w-full rounded-full bg-[#0F6E56]" />
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </MotionFadeIn>
      </section>

      <section className="-mx-4 bg-slate-100 px-4 py-10 sm:-mx-6 sm:px-6 sm:py-12 md:py-16 lg:-mx-8 lg:px-8">
        <MotionFadeIn className="mx-auto max-w-6xl" delay={0.13}>
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Neden Sezondakirala?
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {valueCards.map(({ title, description, Icon }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-[#0F6E56]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </MotionFadeIn>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 md:py-16">
        <MotionFadeIn delay={0.18}>
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0F6E56]">
            Yasal Güvence
          </span>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">TURSAB Üyesiyiz</h2>
          <div className="mt-6 flex flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-[#0F6E56]">
              <BadgeCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">TURSAB Üyesi — Belge No: 5141</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Yasal mevzuata uygun, güvenilir ve denetlenebilir bir rezervasyon altyapısı sunuyoruz.
              </p>
            </div>
          </div>
        </MotionFadeIn>
      </section>

      <section className="-mx-4 bg-[#0F6E56] px-4 py-14 text-center text-white sm:-mx-6 sm:px-6 md:py-16 lg:-mx-8 lg:px-8">
        <MotionFadeIn className="mx-auto max-w-4xl" delay={0.22}>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Hayalinizdeki Tatile Hazır mısınız?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-emerald-50">
            Fethiye&apos;nin en güzel villalarını ve teknelerini keşfedin.
          </p>
          <Link
            href="/konaklama"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0F6E56] transition-colors hover:bg-emerald-50"
          >
            İlanları İncele
          </Link>
        </MotionFadeIn>
      </section>
    </div>
  );
}
