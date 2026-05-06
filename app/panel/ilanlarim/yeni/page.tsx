import { NewListingWizard } from "@/components/new-listing-wizard";

type NewListingPageProps = {
  searchParams: Promise<{ adim?: string }>;
};

export default async function NewListingPage({ searchParams }: NewListingPageProps) {
  const params = await searchParams;
  const step = Number(params.adim ?? "1");

  const adim = Number.isNaN(step) ? 1 : step;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Yeni İlan Ekle</h1>
      {/** key={adim} kaldırıldı: her adımda remount olup tüm form state sıfırlanıyordu; 4. adımda Gönder tıklanamazdı. */}
      <NewListingWizard initialStep={adim} />
    </div>
  );
}
