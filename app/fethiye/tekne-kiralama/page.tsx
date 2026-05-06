import type { Metadata } from "next";
import { getPlatformSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Fethiye Tekne Kiralama — Gület ve Sürat Teknesi",
    description: "Fethiye tekne kiralama seçenekleri, rota önerileri ve rezervasyon ipuçları.",
    openGraph: {
      title: "Fethiye Tekne Kiralama — Gület ve Sürat Teknesi",
      description: "Fethiye tekne kiralama seçenekleri, rota önerileri ve rezervasyon ipuçları.",
      images: ["/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Fethiye Tekne Kiralama — Gület ve Sürat Teknesi",
      description: "Fethiye tekne kiralama seçenekleri, rota önerileri ve rezervasyon ipuçları.",
      images: ["/og-image.jpg"],
    },
  };
}

export default async function FethiyeBoatSeoPage() {
  const settings = await getPlatformSettings();

  return (
    <section className="w-full space-y-4 overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900">Fethiye Tekne Kiralama</h1>
      <h2 className="text-xl font-semibold text-slate-900">Fethiye&apos;de Tekne Kiralama Neden Bu Kadar Popüler?</h2>
      <p className="text-slate-700">Fethiye tekne kiralama, Akdeniz&apos;in en özel koylarını kalabalıktan uzak şekilde keşfetmek isteyen misafirler için ideal bir tatil modelidir. Karadan ulaşımı zor olan mavi ve turkuaz tonlardaki koylara gün içinde birden fazla durakta uğramak, tekne tatilinin en büyük avantajıdır. İster günlük kısa rota, ister tam gün özel tur, ister haftalık konaklamalı plan olsun, farklı bütçelere uygun alternatifler bulunur. Özellikle arkadaş grupları, özel kutlamalar ve aile organizasyonları için tekne kiralama esnek bir deneyim sunar.</p>
      <h2 className="text-xl font-semibold text-slate-900">Tekne Türleri ve Kullanım Senaryoları</h2>
      <p className="text-slate-700">Fethiye bölgesinde en yaygın seçenekler gület, motoryat ve sürat teknesidir. Gületler geniş yaşam alanı, güneşlenme bölümü ve konforlu seyir özellikleriyle tam gün programlar için tercih edilir. Motoryatlar daha premium deneyim isteyen, servis ve konfor beklentisi yüksek misafirler için güçlü bir seçenektir. Sürat tekneleri ise daha kısa sürede çok durak görmek isteyenler için idealdir. Tekne seçimi yaparken kişi kapasitesi, müzik/ikram talepleri, çocukla kullanım uygunluğu ve gölgelik alan kapasitesi mutlaka değerlendirilmelidir.</p>
      <h2 className="text-xl font-semibold text-slate-900">Önerilen Rotalar ve Dönemler</h2>
      <p className="text-slate-700">Fethiye çıkışlı tekne turlarında Ölüdeniz, Gemiler Adası, Kelebekler Vadisi, Akvaryum Koyu ve Göcek adaları en çok tercih edilen rotalar arasındadır. Sabah erken çıkış yapılan planlarda deniz daha sakin olur ve koylarda daha uzun süre keyif yapmak mümkün hale gelir. Temmuz-ağustos döneminde yoğunluk arttığı için erken rezervasyon önem kazanır. Mayıs-haziran ve eylül-ekim aralığında ise hava-deniz dengesi oldukça keyifli olup fiyat/performans açısından avantaj sağlanır.</p>
      <h2 className="text-xl font-semibold text-slate-900">Rezervasyon Öncesinde Nelere Dikkat Etmeli?</h2>
      <p className="text-slate-700">Tekne kiralama rezervasyonu öncesinde hareket saati, dönüş saati, dahil hizmetler ve ekstra ücretler netleştirilmelidir. Yakıtın fiyata dahil olup olmadığı, kaptan/ekip hizmetinin kapsamı, yiyecek-içecek seçenekleri ve iptal politikası mutlaka kontrol edilmelidir. Güvenlik ekipmanlarının tam olması, teknenin lisans bilgileri ve misafir kapasitesinin mevzuata uygunluğu da kritik kriterlerdir. Eğer çocuklu bir plan yapılıyorsa teknenin gölgelik alanı ve güvenlik düzeni ayrıca sorgulanmalıdır.</p>
      <h2 className="text-xl font-semibold text-slate-900">Bütçe Planlaması ve Konfor Dengesi</h2>
      <p className="text-slate-700">Fethiye tekne kiralama fiyatları; tekne tipi, kişi sayısı, sezon, rota uzunluğu ve hizmet kapsamına göre değişir. Daha ekonomik bir deneyim için sabit rotalı günlük planlar tercih edilebilirken, kişiselleştirilmiş özel turlar daha yüksek bütçe gerektirebilir. Toplam maliyeti hesaplarken temel kiralama bedeline ek olarak yakıt, liman ücretleri, özel ikramlar ve transfer gibi kalemlerin dahil olup olmadığını kontrol etmek önemlidir. Doğru planlama ile hem konforlu hem de bütçeyi dengede tutan bir deneyim elde etmek mümkündür.</p>
      <h2 className="text-xl font-semibold text-slate-900">Tekne Turunda Konforu Artıran Detaylar</h2>
      <p className="text-slate-700">Tekne turunun kalitesini belirleyen unsurlar yalnızca rota ve tekne tipi değildir. Güneşten korunma alanı, duş ve tuvalet temizliği, oturma düzeninin rahatlığı, müzik sistemi kalitesi ve servis planı da deneyimi doğrudan etkiler. Eğer doğum günü, evlilik teklifi veya özel kutlama planlanıyorsa dekorasyon, menü ve zamanlama detaylarının rezervasyon aşamasında netleştirilmesi gerekir. Deniz tutmasına karşı önlem almak, yanınıza hafif kıyafet ve güneş koruyucu almak, çocuklu turlarda güvenlik kurallarını önceden konuşmak da günü daha keyifli hale getirir. İyi planlanan bir tekne turu, Fethiye tatilinin en unutulmaz anısına dönüşebilir.</p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Fethiye tekne kiralama fiyatları nelerden etkilenir?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Fiyatlar tekne tipi, sezon, rota süresi, kişi sayısı ve dahil hizmetlere göre değişir.",
                },
              },
              {
                "@type": "Question",
                name: "Yakıt ücreti fiyata dahil mi?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Tekneden tekneye değişebilir; rezervasyon öncesi dahil hizmetler kısmı mutlaka kontrol edilmelidir.",
                },
              },
            ],
          }),
        }}
      />
      <p className="text-sm text-slate-600">TURSAB Belge No: {settings.tursabNo}</p>
    </section>
  );
}
