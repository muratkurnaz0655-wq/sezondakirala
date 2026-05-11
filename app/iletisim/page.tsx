import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformSettings } from "@/lib/settings";
import { SITE_NAME, formatWhatsappTrDisplay, whatsappHref } from "@/lib/constants";
import { ContactForm } from "@/components/contact-form";
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
    <div className="-mx-4 w-[calc(100%+2rem)] bg-[#f8f9fa] px-4 py-10 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 md:py-12 lg:-mx-8 lg:w-[calc(100%+4rem)] lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8 overflow-x-hidden">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">İletişim</h1>
          <p className="mt-2 text-slate-500">
          Sorularınız için bize yazın veya WhatsApp üzerinden anında ulaşın.
          </p>
          <div className="mx-auto mt-4 h-[2px] w-28 rounded-full bg-gradient-to-r from-transparent via-[#185FA5] to-transparent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a href={phoneHref} className="hover-lift-soft rounded-xl border border-slate-200 border-l-4 border-l-[#185FA5] bg-white p-4">
                <Phone className="mb-2 h-6 w-6 text-[#185FA5]" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Telefon</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{formatWhatsappTrDisplay(settings.whatsappNumber)}</p>
              </a>
              <Link href={wa} className="hover-lift-soft rounded-xl border border-slate-200 border-l-4 border-l-[#1D9E75] bg-white p-4">
                <MessageCircle className="mb-2 h-6 w-6 text-[#1D9E75]" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">WhatsApp</p>
                <p className="mt-1 text-base font-semibold text-slate-900">Mesaj Gönder</p>
              </Link>
              <a
                href={`mailto:${settings.contactEmail}`}
                className="hover-lift-soft rounded-xl border border-slate-200 border-l-4 border-l-[#f59e0b] bg-white p-4"
              >
                <Mail className="mb-2 h-6 w-6 text-[#f59e0b]" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">E-posta</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{settings.contactEmail}</p>
              </a>
              <div className="hover-lift-soft rounded-xl border border-slate-200 border-l-4 border-l-[#7c3aed] bg-white p-4">
                <Clock3 className="mb-2 h-6 w-6 text-[#7c3aed]" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Çalışma Saatleri</p>
                <p className="mt-1 text-base font-semibold text-slate-900">Pzt-Cmt 09:00-18:00</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Konumumuz</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
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
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-[#185FA5]" /> Fethiye, Muğla, Türkiye
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Mesaj Bırakın</h2>
            <p className="mt-2 text-sm text-slate-500">
              Formu doldurduğunuzda mesajınız doğrudan destek ekibimize iletilir.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
