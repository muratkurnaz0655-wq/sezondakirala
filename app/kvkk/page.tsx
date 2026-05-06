import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "KVKK Aydınlatma Metni",
    description: `${SITE_NAME} kişisel veri işleme ve KVKK aydınlatma metni.`,
    openGraph: {
      title: "KVKK Aydınlatma Metni",
      description: `${SITE_NAME} kişisel veri işleme ve KVKK aydınlatma metni.`,
      images: ["/og-image.jpg"],
    },
  };
}

export default function KvkkPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 sm:space-y-6 md:space-y-8 overflow-x-hidden bg-white px-4 py-10 sm:py-12">
      <header className="space-y-3">
        <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          Yasal Bilgilendirme
        </p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          KVKK Aydınlatma Metni
        </h1>
        <p className="text-sm text-slate-500">
          Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin
          hangi amaçlarla işlendiğini ve haklarınızı özetlemek için hazırlanmıştır.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">1. Veri Sorumlusu</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Kişisel verileriniz, {SITE_NAME} platformu tarafından veri sorumlusu sıfatıyla işlenir.
          İletişim talepleriniz için{" "}
          <Link href="/iletisim" className="font-medium text-[#0e9aa7] hover:underline">
            İletişim
          </Link>{" "}
          sayfasını kullanabilirsiniz.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">2. İşlenen Veri Kategorileri</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Kimlik ve iletişim bilgileri (ad-soyad, e-posta, telefon)</li>
          <li>Hesap ve üyelik verileri</li>
          <li>Rezervasyon, ödeme ve talep süreçlerine ilişkin işlem verileri</li>
          <li>Teknik kayıtlar (güvenlik logları, oturum ve erişim bilgileri)</li>
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">3. İşleme Amaçları ve Hukuki Sebep</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Verileriniz; rezervasyon süreçlerinin yürütülmesi, üyelik işlemleri, müşteri destek
          hizmetlerinin sunulması, yasal yükümlülüklerin yerine getirilmesi ve platform güvenliğinin
          sağlanması amaçlarıyla KVKK’nın 5 ve 6. maddelerinde belirtilen hukuki sebepler kapsamında
          işlenir.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">4. Aktarım ve Saklama</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Kişisel verileriniz, mevzuatın izin verdiği ölçüde iş ortakları, tedarikçiler ve yetkili kamu
          kurumlarıyla paylaşılabilir. Veriler, işleme amacı için gerekli süre boyunca ve ilgili mevzuatın
          öngördüğü saklama süresi kadar korunur.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">5. Haklarınız</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          KVKK’nın 11. maddesi kapsamında; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya
          silinmesini talep etme ve itiraz etme haklarına sahipsiniz. Talepleriniz için{" "}
          <Link href="/iletisim" className="font-medium text-[#0e9aa7] hover:underline">
            İletişim
          </Link>{" "}
          sayfasından bize ulaşabilirsiniz.
        </p>
      </section>
    </div>
  );
}
