"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReservationWizard } from "@/components/reservation-wizard";
import { aramaStore, rezervasyonStore } from "@/lib/arama-store";
import { looksLikeUuid } from "@/lib/rezervasyon-segment";
import { createClient } from "@/lib/supabase/client";
import { TURSAB_NO } from "@/lib/constants";
import { istanbulDateString } from "@/lib/tr-today";

type ReservationListing = {
  id: string;
  tip?: "villa" | "tekne" | null;
  ilan_medyalari?: Array<{ url: string; sira: number }> | null;
  baslik: string | null;
  konum: string | null;
  kapasite: number | null;
  gunluk_fiyat: number | null;
  ilk_resim_url?: string | null;
};

export default function ReservationPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [ready, setReady] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [listing, setListing] = useState<ReservationListing | null>(null);
  const [stored] = useState<ReturnType<typeof rezervasyonStore.get>>(() => rezervasyonStore.get());
  const bugunIso = istanbulDateString();
  const nowIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const plusTwo = useMemo(() => {
    const d = new Date(nowIso);
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, [nowIso]);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/giris?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setAuthChecked(true);
      const { data: bySlug } = await supabase
        .from("ilanlar")
        .select("id,slug,tip,baslik,konum,kapasite,gunluk_fiyat,ilan_medyalari(url,sira)")
        .eq("slug", slug)
        .maybeSingle();
      const byId = looksLikeUuid(slug)
        ? (
            await supabase
              .from("ilanlar")
              .select("id,slug,tip,baslik,konum,kapasite,gunluk_fiyat,ilan_medyalari(url,sira)")
              .eq("id", slug)
              .maybeSingle()
          ).data
        : null;
      const data = bySlug ?? byId;
      if (!data) {
        router.replace(`/konaklama/${slug}`);
        return;
      }
      setListing(data as ReservationListing);
      setReady(true);
    })();
  }, [router, slug]);

  if (!authChecked || !ready || !listing) {
    return <div className="py-12 text-center text-slate-600">Rezervasyon yükleniyor…</div>;
  }

  const activeStored = stored?.slug === slug ? stored : null;
  const arama = aramaStore.get();
  const ilanTip = activeStored?.ilanTip ?? listing.tip ?? "villa";
  const kapakUrl =
    listing.ilk_resim_url ??
    (listing.ilan_medyalari && listing.ilan_medyalari.length
      ? [...listing.ilan_medyalari].sort((a, b) => a.sira - b.sira)[0]?.url ?? null
      : null);
  const defaultGiris = activeStored?.giris ?? arama?.giris ?? nowIso;
  const defaultCikis =
    ilanTip === "tekne"
      ? new Date(new Date(defaultGiris).getTime() + (activeStored?.gun ?? arama?.gun ?? 1) * 86400000)
          .toISOString()
          .slice(0, 10)
      : (activeStored?.cikis ?? arama?.cikis ?? plusTwo);

  return (
    <ReservationWizard
      rezervasyonIlanId={listing.id}
      bugunIso={bugunIso}
      varsayilanGiris={defaultGiris}
      varsayilanCikis={defaultCikis}
      varsayilanYetiskin={activeStored?.yetiskin ?? arama?.yetiskin ?? 2}
      varsayilanCocuk={activeStored?.cocuk ?? arama?.cocuk ?? 0}
      varsayilanBebek={activeStored?.bebek ?? arama?.bebek ?? 0}
      gunlukFiyat={listing.gunluk_fiyat ?? 0}
      initialStep={activeStored?.adim ?? 1}
      tursabNo={TURSAB_NO}
      initialReferenceNo={`SZK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`}
      listingTitle={listing.baslik ?? "Seçilen ilan"}
      listingKonum={listing.konum ?? ""}
      listingKapakUrl={kapakUrl}
      maxKapasite={listing.kapasite ?? 1}
      packageSummary={null}
    />
  );
}
