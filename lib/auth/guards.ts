import { createClient } from "@/lib/supabase/server";

type GuardFail = { ok: false; error: string };

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Oturum bulunamadi." } as GuardFail;
  return { ok: true, user, supabase } as const;
}

export async function requireAdminUser() {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth;

  const { data: profile } = await auth.supabase
    .from("kullanicilar")
    .select("rol")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.rol !== "admin") {
    return { ok: false, error: "Bu alan icin admin yetkisi gerekli." } as GuardFail;
  }

  return auth;
}

export async function requireOwnerListingAccess(listingId: string) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth;

  const { data: listing } = await auth.supabase
    .from("ilanlar")
    .select("id,sahip_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return { ok: false, error: "Ilan bulunamadi." } as GuardFail;
  if (listing.sahip_id !== auth.user.id) {
    return { ok: false, error: "Bu ilan icin yetkiniz yok." } as GuardFail;
  }

  return { ...auth, listing } as const;
}

export async function requireOwnerReservationAccess(reservationId: string) {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return auth;

  const { data: reservation } = await auth.supabase
    .from("rezervasyonlar")
    .select("id,ilan_id")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation) return { ok: false, error: "Rezervasyon bulunamadi." } as GuardFail;

  const listingAccess = await requireOwnerListingAccess(reservation.ilan_id);
  if (!listingAccess.ok) return listingAccess;

  return { ...listingAccess, reservation } as const;
}
