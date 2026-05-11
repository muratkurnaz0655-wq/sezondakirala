import type { Metadata } from "next";
import { SssPageClient } from "./SssPageClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sıkça Sorulan Sorular",
    description:
      "Rezervasyon, ödeme, iptal, ilan sahipleri ve güvenlik hakkında sık sorulan sorular.",
    openGraph: {
      title: "Sıkça Sorulan Sorular",
      description:
        "Rezervasyon, ödeme, iptal, ilan sahipleri ve güvenlik hakkında sık sorulan sorular.",
      images: ["/og-image.jpg"],
    },
  };
}

export default function SssPage() {
  return <SssPageClient />;
}
