import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReservationDetailContent } from "../ReservationDetailContent";

type ReservationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: reservation } = await supabase.from("rezervasyonlar").select("*").eq("id", id).maybeSingle();
  if (!reservation) notFound();

  const [{ data: user }, { data: listing }, { data: pkg }] = await Promise.all([
    reservation.kullanici_id ? supabase.from("kullanicilar").select("ad_soyad,email,telefon").eq("id", reservation.kullanici_id).maybeSingle() : Promise.resolve({ data: null }),
    reservation.ilan_id ? supabase.from("ilanlar").select("baslik").eq("id", reservation.ilan_id).maybeSingle() : Promise.resolve({ data: null }),
    reservation.paket_id ? supabase.from("paketler").select("baslik").eq("id", reservation.paket_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const enrichedReservation = {
    ...reservation,
    kullanici_adi: user?.ad_soyad ?? user?.email ?? "-",
    kullanici_email: user?.email ?? "-",
    kullanici_telefon: user?.telefon ?? "-",
    ilan_baslik: pkg?.baslik ?? listing?.baslik ?? "-",
  };

  return (
    <AdminPageLayout
      title={`Rezervasyon ${reservation.referans_no ?? reservation.id}`}
      description="Rezervasyon detaylarını, durumunu ve admin notlarını yönetin."
      actions={<AdminActionButton href="/yonetim/rezervasyonlar" variant="secondary">Rezervasyonlara Dön</AdminActionButton>}
    >
      <ReservationDetailContent reservation={enrichedReservation as Record<string, unknown>} />
    </AdminPageLayout>
  );
}
