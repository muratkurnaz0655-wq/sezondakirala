import Image from "next/image";
import Link from "next/link";
import { getPlatformSettings } from "@/lib/settings";
import { TURSAB_NO, formatWhatsappTrDisplay, whatsappHref } from "@/lib/constants";
import { WaveDivider } from "@/components/wave-divider";
import { Clock3, Mail, MapPin, MessageCircle, PhoneCall } from "lucide-react";
import { FaFacebook, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";

const quickLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/konaklama", label: "Konaklama" },
  { href: "/tekneler", label: "Tekneler" },
  { href: "/paketler", label: "Paketler" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/sss", label: "SSS" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/kvkk", label: "KVKK" },
];

const serviceLinks = [
  { label: "Villa Kiralama", href: "/konaklama" },
  { label: "Tekne Kiralama", href: "/tekneler" },
  { label: "Tatil Paketleri", href: "/paketler" },
  { label: "Özel Turlar", href: "/paketler?kategori=macera" },
  { label: "Transfer Hizmeti", href: "/iletisim" },
  { label: "Havalimanı Karşılama", href: "/iletisim" },
] as const;

const socialLinks = [
  { icon: FaInstagram, href: "https://instagram.com/sezondakirala", label: "Instagram" },
  { icon: FaFacebook, href: "https://facebook.com/sezondakirala", label: "Facebook" },
  { icon: FaXTwitter, href: "https://twitter.com/sezondakirala", label: "Twitter" },
  { icon: FaYoutube, href: "https://youtube.com/sezondakirala", label: "YouTube" },
];

export async function SiteFooter() {
  const settings = await getPlatformSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto text-[#e2e8f0]">
      <WaveDivider color="#080d12" variant="footer" />
      <div className="relative overflow-hidden border-t border-[#0e9aa7]/15 bg-[#080d12]">
      <div className="pointer-events-none absolute -left-20 top-10 h-48 w-48 rounded-full bg-[#0e9aa7]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-[#0f4c5c]/30 blur-3xl" />
      <div className="grid w-full grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <div className="mb-4 flex items-center">
            <Image
              src="/logo-clean.png"
              alt="Sezondakirala"
              width={300}
              height={75}
              className="h-10 w-auto object-contain opacity-90"
            />
          </div>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#64748b]">
            Fethiye&apos;nin en güvenilir villa ve tekne kiralama platformu. TURSAB
            güvencesiyle unutulmaz tatil deneyimleri.
          </p>
          <div className="mt-4 flex gap-2">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-200 hover:scale-105 hover:border-[#0e9aa7]/30 hover:bg-[#0e9aa7]/15 hover:text-[#22d3ee]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0e9aa7]">
            Hızlı Linkler
          </h3>
          <ul className="space-y-2 text-sm text-[#64748b]">
            {quickLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-sm text-[#64748b] transition-colors duration-150 hover:text-[#22d3ee]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0e9aa7]">
            Hizmetler
          </h3>
          <ul className="space-y-2.5 text-sm">
            {serviceLinks.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="inline-block text-sm text-[#64748b] transition-colors duration-150 hover:text-[#22d3ee]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0e9aa7]">
            İletişim
          </h3>
          <ul className="space-y-2 text-sm text-[#64748b]">
            <li className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#22d3ee]" /> Fethiye, Muğla, Türkiye
            </li>
            <li className="inline-flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-[#22d3ee]" />{" "}
              {formatWhatsappTrDisplay(settings.whatsappNumber)}
            </li>
            <li>
              <a
                href={whatsappHref(settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center gap-2 text-[#94a3b8] transition hover:text-[#22d3ee]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp ile ulaşın
              </a>
            </li>
            <li className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#22d3ee]" /> {settings.contactEmail}
            </li>
            <li className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#22d3ee]" /> Pazartesi-Cumartesi: 09:00-18:00
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#0e9aa7]/10 bg-[#080d12]">
        <div className="w-full px-4 pb-6 pt-6 text-xs md:px-6 lg:px-8">
          <div className="mb-4 flex justify-center">
            <span className="inline-flex max-w-full items-center justify-center rounded-full border border-[#0e9aa7]/35 bg-[#0e9aa7]/10 px-4 py-1.5 text-center text-sm font-medium leading-relaxed text-[#cbd5e1]">
              TÜRSAB Üyesidir - Belge No: {TURSAB_NO}
            </span>
          </div>
          <p className="text-center text-[#334155]">
            © {currentYear} is Powered by Xanthos Dijital. Tüm Hakları Saklıdır.
          </p>
        </div>
      </div>
      </div>
    </footer>
  );
}
