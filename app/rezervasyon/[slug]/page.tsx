"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReservationWizard } from "@/components/reservation-wizard";
import { aramaStore, rezervasyonStore } from "@/lib/arama-store";
import { looksLikeUuid } from "@/lib/rezervasyon-segment";
import { createClient } from "@/lib/supabase/client";
import { TURSAB_NO } from "@/lib/constants";
import { generateReferansNo } from "@/lib/referans-no";
import { istanbulDateString } from "@/lib/tr-today";

type RezervasyonRedirectPayload = {
  ilan_slug: string;
  giris_tarihi: string;
  cikis_tarihi: string;
  misafir_sayisi: number;
  cocuk_sayisi: number;
  bebek_sayisi: number;
};

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
  const [redirectPayload, setRedirectPayload] = useState<RezervasyonRedirectPayload | null>(null);
  const [stored] = useState<ReturnType<typeof rezervasyonStore.get>>(() => rezervasyonStore.get());
  const [placeholderReferans] = useState(() => generateReferansNo());
  const bugunIso = istanbulDateString();
  const nowIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const plusTwo = useMemo(() => {
    const d = new Date(nowIso);
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, [nowIso]);

  useEffect(() => {
    if (!slug) return;
    try {
      const raw = window.localStorage.getItem("rezervasyon_redirect");
      if (raw) {
        const parsed = JSON.parse(raw) as RezervasyonRedirectPayload;
        if (parsed?.ilan_slug === slug) {
          setRedirectPayload(parsed);
          window.localStorage.removeItem("rezervasyon_redirect");
        }
      }
    } catch {
      // Kullanıcıyı engellemeden normal akışa devam et.
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        const currentStored = rezervasyonStore.get();
        const arama = aramaStore.get();
        const selectedGiris =
          currentStored?.slug === slug
            ? (currentStored?.giris ?? arama?.giris ?? nowIso)
            : (arama?.giris ?? nowIso);
        const selectedCikis =
          currentStored?.slug === slug
            ? (currentStored?.cikis ?? arama?.cikis ?? plusTwo)
            : (arama?.cikis ?? plusTwo);
        const selectedYetiskin =
          currentStored?.slug === slug
            ? (currentStored?.yetiskin ?? arama?.yetiskin ?? 2)
            : (arama?.yetiskin ?? 2);
        const selectedCocuk =
          currentStored?.slug === slug
            ? (currentStored?.cocuk ?? arama?.cocuk ?? 0)
            : (arama?.cocuk ?? 0);
        const selectedBebek =
          currentStored?.slug === slug
            ? (currentStored?.bebek ?? arama?.bebek ?? 0)
            : (arama?.bebek ?? 0);
        try {
          const payload: RezervasyonRedirectPayload = {
            ilan_slug: slug,
            giris_tarihi: selectedGiris,
            cikis_tarihi: selectedCikis,
            misafir_sayisi: selectedYetiskin,
            cocuk_sayisi: selectedCocuk,
            bebek_sayisi: selectedBebek,
          };
          window.localStorage.setItem("rezervasyon_redirect", JSON.stringify(payload));
        } catch {
          // localStorage erişilemezse sessizce geç.
        }
        router.replace(`/giris?returnUrl=${encodeURIComponent(`/rezervasyon/${slug}`)}`);
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
  }, [router, slug, nowIso, plusTwo]);

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
  const defaultGiris = redirectPayload?.giris_tarihi ?? activeStored?.giris ?? arama?.giris ?? nowIso;
  const defaultCikis =
    ilanTip === "tekne"
      ? new Date(new Date(defaultGiris).getTime() + (activeStored?.gun ?? arama?.gun ?? 1) * 86400000)
          .toISOString()
          .slice(0, 10)
      : (redirectPayload?.cikis_tarihi ?? activeStored?.cikis ?? arama?.cikis ?? plusTwo);

  return (
    <ReservationWizard
      rezervasyonIlanId={listing.id}
      bugunIso={bugunIso}
      varsayilanGiris={defaultGiris}
      varsayilanCikis={defaultCikis}
      varsayilanYetiskin={redirectPayload?.misafir_sayisi ?? activeStored?.yetiskin ?? arama?.yetiskin ?? 2}
      varsayilanCocuk={redirectPayload?.cocuk_sayisi ?? activeStored?.cocuk ?? arama?.cocuk ?? 0}
      varsayilanBebek={redirectPayload?.bebek_sayisi ?? activeStored?.bebek ?? arama?.bebek ?? 0}
      gunlukFiyat={listing.gunluk_fiyat ?? 0}
      initialStep={activeStored?.adim ?? 1}
      tursabNo={TURSAB_NO}
      initialReferenceNo={placeholderReferans}
      listingTitle={listing.baslik ?? "Seçilen ilan"}
      listingKonum={listing.konum ?? ""}
      listingKapakUrl={kapakUrl}
      maxKapasite={listing.kapasite ?? 1}
      packageSummary={null}
    />
  );
}
