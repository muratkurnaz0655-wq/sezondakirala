import { AdminActionButton } from "@/components/admin/AdminActionButton";
export function ReservationDetailButton({ reservationId }: { reservationId: string }) {
  return (
    <AdminActionButton href={`/yonetim/rezervasyonlar/${reservationId}`} variant="primary">
      Detay
    </AdminActionButton>
  );
}
