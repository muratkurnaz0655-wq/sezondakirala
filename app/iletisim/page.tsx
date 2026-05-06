import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformSettings } from "@/lib/settings";
import { SITE_NAME, formatWhatsappTrDisplay, whatsappHref } from "@/lib/constants";
import { mesajGonder } from "@/app/iletisim/actions";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "İletişim",
    description: `${SITE_NAME} iletişim ve destek.`,
    openGraph: { title: "İletişim", description: `${SITE_NAME} iletişim ve destek.`, images: ["/og-image.jpg"] },
  };
}

export default async function IletisimPage() {
  const settings = await getPlatformSettings();
  const wa = whatsappHref(settings.whatsappNumber);
  const phoneHref = `tel:+${settings.whatsappNumber.replace(/\D/g, "")}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 md:space-y-10 overflow-x-hidden bg-white px-4 py-10 sm:py-12">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">İletişim</h1>
        <p className="mt-2 text-slate-500">
          Sorularınız için bize yazın veya WhatsApp üzerinden anında ulaşın.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a href={phoneHref} className="rounded-xl border border-slate-200 bg-[#f0fdfd] p-4 transition-all hover:border-[#0e9aa7]/45">
              <Phone className="mb-2 h-5 w-5 text-[#0e9aa7]" />
              <p className="text-xs font-semibold uppercase text-slate-500">Telefon</p>
              <p className="text-sm text-slate-800">{formatWhatsappTrDisplay(settings.whatsappNumber)}</p>
            </a>
            <Link href={wa} className="rounded-xl border border-slate-200 bg-[#f0fdfd] p-4 transition-all hover:border-[#0e9aa7]/45">
              <MessageCircle className="mb-2 h-5 w-5 text-[#0e9aa7]" />
              <p className="text-xs font-semibold uppercase text-slate-500">WhatsApp</p>
              <p className="text-sm text-slate-800">Mesaj Gönder</p>
            </Link>
            <a
              href={`mailto:${settings.contactEmail}`}
              className="rounded-xl border border-slate-200 bg-[#f0fdfd] p-4 transition-all hover:border-[#0e9aa7]/45"
            >
              <Mail className="mb-2 h-5 w-5 text-[#0e9aa7]" />
              <p className="text-xs font-semibold uppercase text-slate-500">E-posta</p>
              <p className="text-sm text-slate-800">{settings.contactEmail}</p>
            </a>
            <div className="rounded-xl border border-slate-200 bg-[#f0fdfd] p-4">
              <Clock3 className="mb-2 h-5 w-5 text-[#0e9aa7]" />
              <p className="text-xs font-semibold uppercase text-slate-500">Çalışma Saatleri</p>
              <p className="text-sm text-slate-800">Pzt-Cmt 09:00-18:00</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <iframe
              title="Fethiye harita"
              src="https://www.google.com/maps?q=Fethiye,+Mu%C4%9Fla,+T%C3%BCrkiye&output=embed"
              width="100%"
              height="280"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#f0fdfd] px-3 py-1.5 text-xs text-slate-500">
            <MapPin className="h-4 w-4" /> Fethiye, Muğla, Türkiye
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Mesaj bırakın</h2>
        <p className="mt-1 text-sm text-slate-500">
          Formu doldurduğunuzda mesajınız doğrudan destek ekibimize iletilir.
        </p>
        <form className="mt-4 space-y-3" action={mesajGonder}>
          <div>
            <label className="text-xs font-medium text-slate-500">Ad Soyad</label>
            <input
              required
              name="ad"
              type="text"
              placeholder="Adınız Soyadınız"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/25"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-500">E-posta</label>
              <input
                required
                name="email"
                type="email"
                placeholder="ornek@mail.com"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/25"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Telefon</label>
              <input
                name="telefon"
                type="tel"
                placeholder="+90 5xx xxx xx xx"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/25"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Konu</label>
            <input
              name="konu"
              type="text"
              placeholder="Konu"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/25"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Mesajınız</label>
            <textarea
              required
              name="mesaj"
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/25"
              placeholder="Mesajınızı yazın..."
            />
          </div>
          <button type="submit" className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#0e9aa7] to-[#22d3ee] px-5 py-2.5 text-sm font-bold text-[#0d1117] transition-all hover:from-[#22d3ee] hover:to-[#0e9aa7] active:scale-95">
            Mesaj Gönder
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
