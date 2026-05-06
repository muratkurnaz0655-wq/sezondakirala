import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { PageListingHero } from "@/components/page-listing-hero";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sıkça Sorulan Sorular",
    description: "Rezervasyon, ödeme ve ilan süreçleri hakkında sık sorulan sorular.",
    openGraph: {
      title: "Sıkça Sorulan Sorular",
      description: "Rezervasyon, ödeme ve ilan süreçleri hakkında sık sorulan sorular.",
      images: ["/og-image.jpg"],
    },
  };
}

const faqItems: [string, string][] = [
  [
    "Rezervasyon nasıl yapılır?",
    "İlan detayından giriş–çıkış tarihlerini ve misafir sayısını seçin. Rezervasyon sihirbazında adımları izleyerek ödeme yönteminizi seçip onaylayın. Onay sonrası e-posta ile özet bilgi alırsınız.",
  ],
  [
    "Ödeme yöntemleri nelerdir?",
    "Kredi / banka kartı ve havale seçenekleri sunulur. Güvenli ödeme altyapısı ile kart bilgileriniz işlenir; havalede dekont ve referans bilgisi talep edilebilir.",
  ],
  [
    "İptal politikası nedir?",
    "İptal ve iade koşulları ilan sahibi ve seçtiğiniz döneme göre değişebilir. Rezervasyon öncesi ilan detayındaki notları ve sözleşme özetini mutlaka okuyun.",
  ],
  [
    "Giriş–çıkış saatleri nedir?",
    "Varsayılan olarak gün içi giriş ve sabah çıkış saatleri ilan sayfasında belirtilir. Erken giriş veya geç çıkış talepleri için ilan sahibi veya destek hattıyla iletişime geçebilirsiniz.",
  ],
  [
    "Depozito alınıyor mu?",
    "Bazı villalarda hasar güvencesi veya ön ödeme olarak depozito istenebilir. Tutar ve iade şartları ilan veya rezervasyon onayında açıkça yer alır.",
  ],
  [
    "Villa sahibi nasıl ilan ekler?",
    "Kayıt sırasında «İlan Sahibi» rolünü seçin. Giriş yaptıktan sonra panelden «Yeni ilan» ile fotoğraf, fiyat, takvim ve özellikleri girin; yayın için admin onayı gerekir.",
  ],
  [
    "İlanlar nasıl onaylanır?",
    "Yeni ilanlar ekibimizce incelenir; eksik bilgi veya uyumsuzluk varsa düzeltme talebi gönderilir. Onaylanan ilanlar ana liste ve arama sonuçlarında görünür.",
  ],
  [
    "TURSAB güvencesi ne anlama gelir?",
    "Platformumuz TURSAB çatısı altında faaliyet gösterir; belge numarası footer’da yer alır. Bu, yasal çerçevede hizmet verdiğimizi ve şikâyet süreçlerinin tanımlı olduğunu gösterir.",
  ],
  [
    "Takvimde dolu günler nasıl belirlenir?",
    "Onaylanmış veya beklemedeki rezervasyonlar ile ilan sahibinin manuel kapattığı günler «dolu» olarak işlenir; müsait günlerde güncel gecelik fiyat gösterilir.",
  ],
  [
    "Sezon fiyatları nedir?",
    "Yüksek sezon veya özel etkinlik dönemlerinde gecelik fiyatın farklılaşmasıdır. Takvimde ilgili günler için fiyatlar ayrı ayrı hesaplanır.",
  ],
  [
    "WhatsApp üzerinden rezervasyon yapılır mı?",
    "WhatsApp ile bilgi ve uygunluk sorabilirsiniz; kesin rezervasyon ve ödeme için platform üzerindeki rezervasyon akışını tamamlamanız gerekir.",
  ],
  [
    "Sorun yaşarsam ne yapmalıyım?",
    "Önce ilan sahibi veya rezervasyon özetinizdeki iletişim bilgilerini kullanın. Çözülmezse İletişim sayfası veya WhatsApp destek hattımızdan bize yazın; kayıtlı rezervasyon numaranızı belirtin.",
  ],
];

export default function FaqPage() {
  return (
    <div className="w-full overflow-x-hidden bg-white">
      <PageListingHero
        breadcrumbCurrent="SSS"
        title="Sıkça Sorulan Sorular"
        subtitle="Merak ettiğiniz her şey burada — hızlıca göz atın."
      />

      <section className="mx-auto max-w-3xl space-y-2 px-4 py-10">
        {faqItems.map(([question, answer]) => (
          <details
            key={question}
            className="group mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-[#0e9aa7]/50 open:rounded-xl open:border-[#0e9aa7]/30 open:bg-[#f0fdfd]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
              <span className="text-sm sm:text-base font-semibold text-slate-800 transition-colors">
                {question}
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-[#0e9aa7] transition-transform duration-200 group-open:rotate-180" aria-hidden />
            </summary>
            <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-open:grid-rows-[1fr]">
              <div className="overflow-hidden">
                <p className="border-t border-slate-200 px-4 sm:px-5 py-4 text-sm leading-relaxed text-slate-600">{answer}</p>
              </div>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
