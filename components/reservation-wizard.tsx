"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { createReservation, sendReservationConfirmation } from "@/app/actions/reservation";
import { aramaStore, rezervasyonStore } from "@/lib/arama-store";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME, WHATSAPP_NUMBER } from "@/lib/constants";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Check,
  CreditCard,
  Mail,
  Info,
  Landmark,
  Lock,
  MapPin,
  Shield,
  Users,
} from "lucide-react";
import { ClientDayPicker } from "@/components/day-picker-client";
import { generateReferansNo } from "@/lib/referans-no";
import { dateFromYmdLocal } from "@/lib/tr-today";
import { toast } from "sonner";

const FALLBACK_KAPAK =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80";

/** Ortak adım kartı + buton stilleri (yalnızca görsel) */
const STEP_CARD = "rounded-[12px] border border-slate-200 bg-white px-8 py-7";
const STEP_TITLE = "text-[22px] font-medium tracking-tight text-slate-900";
const STEP_SUB = "mt-1 text-sm text-slate-500";
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all duration-200 ease-in-out";
const BTN_PRIMARY = `${BTN_BASE} min-h-11 bg-[#185FA5] text-white hover:bg-[#154d86] active:brightness-[0.97]`;
const BTN_WHITE = `${BTN_BASE} min-h-11 border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:brightness-[0.98]`;
const INPUT_FOCUS =
  "rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 transition-[box-shadow,border-color] focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/35";

const infoSchema = z.object({
  ad: z.string().min(2, "Ad zorunludur."),
  soyad: z.string().min(2, "Soyad zorunludur."),
  telefon: z.string().min(10, "Geçerli telefon giriniz."),
  email: z.string().email("Geçerli e-posta giriniz."),
});

const paymentSchema = z.object({
  odeme_yontemi: z.enum(["kart", "havale"]),
});

type ReservationWizardProps = {
  rezervasyonIlanId: string;
  varsayilanGiris: string;
  varsayilanCikis: string;
  varsayilanYetiskin: number;
  varsayilanCocuk: number;
  varsayilanBebek: number;
  gunlukFiyat: number;
  initialStep?: number;
  tursabNo: string;
  initialReferenceNo: string;
  bugunIso: string;
  listingTitle: string;
  listingKonum: string;
  listingKapakUrl: string | null;
  maxKapasite: number;
  packageSummary?: {
    id: string;
    baslik: string;
    sureGun?: number;
    items: { id: string; baslik: string; tip: "villa" | "tekne"; konum: string }[];
  } | null;
};

function calculateDays(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff || 1);
}

function kisaGunAdi(ymd: string) {
  if (!ymd) return "";
  return format(dateFromYmdLocal(ymd), "EEE", { locale: tr });
}

type OzetKartiProps = {
  baslik: string;
  konum: string;
  kapakUrl: string | null;
  girisTarihi: string;
  cikisTarihi: string;
  yetiskin: number;
  cocuk: number;
  gunlukFiyat: number;
  toplamFiyat: number;
  geceSayisi: number;
  tursabNo: string;
  fixedNights?: number | null;
  packageSummary?: {
    id: string;
    baslik: string;
    sureGun?: number;
    items: { id: string; baslik: string; tip: "villa" | "tekne"; konum: string }[];
  } | null;
};

function OzetKarti({
  baslik,
  konum,
  kapakUrl,
  girisTarihi,
  cikisTarihi,
  yetiskin,
  cocuk,
  gunlukFiyat,
  toplamFiyat,
  geceSayisi,
  tursabNo,
  fixedNights = null,
  packageSummary,
}: OzetKartiProps) {
  const kapak = kapakUrl ?? FALLBACK_KAPAK;

  return (
    <div className="sticky top-6 w-full self-start overflow-hidden rounded-[12px] border border-slate-200 bg-white">
      <div className="relative h-44 w-full overflow-hidden rounded-t-[12px]">
        <Image src={kapak} alt={baslik} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 360px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-md border border-white/30 bg-black/25 px-2 py-1 text-xs font-normal text-white">
          {konum || "Konum yok"}
        </span>
      </div>

      <div className="px-8 py-7">
        <div className="mb-4">
          <h3 className="text-base font-semibold leading-snug text-slate-800">
            {packageSummary?.baslik || baslik}
          </h3>
          <div className="mb-4 mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={11} aria-hidden />
            {packageSummary ? "Paket içeriği" : konum || "—"}
          </div>
        </div>

        {packageSummary?.items?.length ? (
          <div className="mb-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Pakete Dahil Olanlar
            </p>
            {packageSummary.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="line-clamp-1 text-slate-700">{item.baslik}</span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                  {item.tip === "tekne" ? "Tekne" : "Villa"}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {girisTarihi && cikisTarihi ? (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">Giriş</p>
              <p className="text-sm font-semibold text-slate-800">
                {format(dateFromYmdLocal(girisTarihi), "d MMM yyyy", { locale: tr })}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">Çıkış</p>
              <p className="text-sm font-semibold text-slate-800">
                {format(dateFromYmdLocal(cikisTarihi), "d MMM yyyy", { locale: tr })}
              </p>
            </div>
          </div>
        ) : null}

        {yetiskin > 0 ? (
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
            <Users size={14} className="text-slate-400" aria-hidden />
            {yetiskin} yetişkin{cocuk > 0 ? `, ${cocuk} çocuk` : ""}
          </div>
        ) : null}

        {geceSayisi > 0 ? (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-sm text-slate-600">
              {fixedNights ? (
                <>
                  <span>Paket fiyatı ({fixedNights} gece)</span>
                  <span>₺{gunlukFiyat.toLocaleString("tr-TR")}</span>
                </>
              ) : (
                <>
                  <span>
                    ₺{gunlukFiyat.toLocaleString("tr-TR")} × {geceSayisi} gece
                  </span>
                  <span>₺{(gunlukFiyat * geceSayisi).toLocaleString("tr-TR")}</span>
                </>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-semibold text-slate-800">Toplam</span>
              <span className="text-lg font-bold text-sky-600">₺{toplamFiyat.toLocaleString("tr-TR")}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Henüz ücret alınmadı
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
          TURSAB Belgeli — No: {tursabNo}
        </div>
      </div>
    </div>
  );
}

export function ReservationWizard({
  rezervasyonIlanId,
  varsayilanGiris,
  varsayilanCikis,
  varsayilanYetiskin,
  varsayilanCocuk,
  varsayilanBebek,
  gunlukFiyat,
  initialStep = 1,
  tursabNo,
  initialReferenceNo,
  bugunIso,
  listingTitle,
  listingKonum,
  listingKapakUrl,
  maxKapasite,
  packageSummary = null,
}: ReservationWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(Math.min(4, Math.max(1, initialStep)));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationRef, setConfirmationRef] = useState<string | null>(null);
  const [savingReservation, setSavingReservation] = useState(false);
  const basMisafir = Math.max(1, varsayilanYetiskin + varsayilanCocuk);
  const [reservationInfo, setReservationInfo] = useState({
    giris_tarihi: varsayilanGiris,
    cikis_tarihi: varsayilanCikis,
    misafir_sayisi: basMisafir,
  });
  const [guestInfo, setGuestInfo] = useState({
    yetiskin: Math.max(1, varsayilanYetiskin),
    cocuk: Math.max(0, varsayilanCocuk),
    bebek: Math.max(0, varsayilanBebek),
  });
  const [ozelIstek, setOzelIstek] = useState("");
  const [acikTakvim, setAcikTakvim] = useState<"giris" | "cikis" | null>(null);
  const takvimRef = useRef<HTMLDivElement | null>(null);
  const fixedPackageNights = packageSummary?.sureGun ? Math.max(1, packageSummary.sureGun) : null;
  const isPackageReservation = Boolean(packageSummary && fixedPackageNights);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (takvimRef.current && !takvimRef.current.contains(target)) setAcikTakvim(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const infoForm = useForm<z.infer<typeof infoSchema>>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      ad: "",
      soyad: "",
      telefon: "",
      email: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled && user?.email) {
        infoForm.setValue("email", user.email);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [infoForm]);

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      odeme_yontemi: "kart",
    },
  });
  const selectedPaymentMethod = useWatch({
    control: paymentForm.control,
    name: "odeme_yontemi",
  });

  const totalPrice = useMemo(() => {
    const dayCount = calculateDays(reservationInfo.giris_tarihi, reservationInfo.cikis_tarihi);
    const fixedTotal = isPackageReservation ? gunlukFiyat : dayCount * gunlukFiyat;
    return {
      days: dayCount,
      nightTotal: fixedTotal,
      average: gunlukFiyat,
      total: fixedTotal,
    };
  }, [gunlukFiyat, isPackageReservation, reservationInfo.cikis_tarihi, reservationInfo.giris_tarihi]);

  function goToStep(nextStep: number) {
    setStep(nextStep);
    rezervasyonStore.update({
      adim: nextStep,
      giris: reservationInfo.giris_tarihi,
      cikis: reservationInfo.cikis_tarihi,
      yetiskin: guestInfo.yetiskin,
      cocuk: guestInfo.cocuk,
      bebek: guestInfo.bebek,
    });
  }

  function validateStep1() {
    if (!reservationInfo.giris_tarihi) {
      setErrorMessage("Giriş tarihi seçiniz.");
      return false;
    }
    if (!reservationInfo.cikis_tarihi) {
      setErrorMessage("Çıkış tarihi seçiniz.");
      return false;
    }
    if (reservationInfo.cikis_tarihi <= reservationInfo.giris_tarihi) {
      setErrorMessage("Çıkış tarihi giriş tarihinden sonra olmalı.");
      return false;
    }
    if (fixedPackageNights && calculateDays(reservationInfo.giris_tarihi, reservationInfo.cikis_tarihi) !== fixedPackageNights) {
      setErrorMessage(`Bu paket sabit ${fixedPackageNights} gece olarak rezerve edilir.`);
      return false;
    }
    if (guestInfo.yetiskin < 1) {
      setErrorMessage("En az 1 yetişkin gerekli.");
      return false;
    }
    const toplamMisafir = guestInfo.yetiskin + guestInfo.cocuk;
    if (toplamMisafir > maxKapasite) {
      setErrorMessage(`Bu ilan maksimum ${maxKapasite} kişi kapasitelidir.`);
      return false;
    }
    return true;
  }

  function validateStep3() {
    const method = paymentForm.getValues("odeme_yontemi");
    if (!method) {
      setErrorMessage("Ödeme yöntemi seçiniz.");
      return false;
    }
    return true;
  }

  function submitInfo(values: z.infer<typeof infoSchema>) {
    setErrorMessage(null);
    infoForm.reset(values);
    goToStep(3);
  }

  async function submitPayment() {
    if (!validateStep3()) return;
    setErrorMessage(null);
    setSavingReservation(true);

    const referenceNo = generateReferansNo();
    const userInfo = infoForm.getValues();
    const odemeYontemi = paymentForm.getValues("odeme_yontemi");
    const paketId = packageSummary?.id?.trim() ? packageSummary.id.trim() : null;
    const misafirSayisi = guestInfo.yetiskin + guestInfo.cocuk;

    try {
      const createResult = await createReservation({
        ilanId: rezervasyonIlanId,
        paketId,
        girisTarihi: reservationInfo.giris_tarihi,
        cikisTarihi: reservationInfo.cikis_tarihi,
        misafirSayisi,
        toplamFiyat: totalPrice.total,
        odemeYontemi,
        referansNo: referenceNo,
      });
      if (!createResult.success) {
        if ((createResult.error ?? "").toLocaleLowerCase("tr").includes("oturum")) {
          toast.error("Oturumunuz sona erdi, lütfen tekrar giriş yapın");
          router.push("/giris");
          return;
        }
        setErrorMessage(createResult.error);
        return;
      }

      toast.success("Rezervasyonunuz alındı!");
      setConfirmationRef(referenceNo);
      setReservationInfo((prev) => ({ ...prev, misafir_sayisi: misafirSayisi }));
      goToStep(4);

      startTransition(async () => {
        const result = await sendReservationConfirmation({
          email: userInfo.email,
          adSoyad: `${userInfo.ad} ${userInfo.soyad}`,
          referansNo: referenceNo,
          ilanBaslik: listingTitle,
          girisTarihi: reservationInfo.giris_tarihi,
          cikisTarihi: reservationInfo.cikis_tarihi,
          misafirSayisi,
          toplamFiyat: totalPrice.total,
          odemeYontemi,
        });
        if (!result.success) {
          setErrorMessage(result.error ?? "E-posta gönderiminde hata oluştu.");
        }
      });
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? `Beklenmeyen hata: ${e.message}` : "Beklenmeyen hata oluştu.",
      );
    } finally {
      setSavingReservation(false);
    }
  }

  const referansGoster = confirmationRef ?? initialReferenceNo;
  const waDigits = WHATSAPP_NUMBER.replace(/\D/g, "");
  const waHref = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    `Merhaba, ${referansGoster} referans numaralı rezervasyonum hakkında bilgi almak istiyorum.`,
  )}`;

  const ozet = (
    <OzetKarti
      baslik={listingTitle}
      konum={listingKonum}
      kapakUrl={listingKapakUrl}
      girisTarihi={reservationInfo.giris_tarihi}
      cikisTarihi={reservationInfo.cikis_tarihi}
      yetiskin={guestInfo.yetiskin}
      cocuk={guestInfo.cocuk}
      gunlukFiyat={gunlukFiyat}
      toplamFiyat={totalPrice.total}
      geceSayisi={totalPrice.days}
      tursabNo={tursabNo}
      fixedNights={fixedPackageNights}
      packageSummary={packageSummary}
    />
  );
  const stepTitles = ["Tarihler", "Bilgiler", "Ödeme", "Onay"] as const;
  const canNavigateToStep = (targetStep: number) => targetStep < step;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="w-full border-b border-slate-100 bg-white px-4 py-5 xl:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-1">
            <p className="text-center text-xs font-medium text-slate-500">Adım {step} / 4</p>
            <div className="flex w-full items-center">
              {stepTitles.map((ad, i) => (
                <Fragment key={ad}>
                  <div className="flex min-w-0 flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {i > 0 ? (
                        <div
                          className={`h-0.5 min-w-[8px] flex-1 rounded-full transition-all duration-300 ${step > i ? "bg-emerald-500" : "bg-slate-200"}`}
                          aria-hidden
                        />
                      ) : (
                        <div className="min-w-[8px] flex-1" aria-hidden />
                      )}
                      {canNavigateToStep(i + 1) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage(null);
                            goToStep(i + 1);
                          }}
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                            step > i + 1
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                              : step === i + 1
                                ? "pulse-soft bg-[#185FA5] text-white shadow-sm shadow-sky-600/25"
                                : "border border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                          aria-label={`${i + 1}. adıma dön`}
                        >
                          {step > i + 1 ? <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden /> : i + 1}
                        </button>
                      ) : (
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            step > i + 1
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                              : step === i + 1
                                ? "pulse-soft bg-[#185FA5] text-white shadow-sm shadow-sky-600/25"
                                : "border border-slate-200 bg-slate-100 text-slate-500"
                          }`}
                        >
                          {step > i + 1 ? <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden /> : i + 1}
                        </div>
                      )}
                      {i < stepTitles.length - 1 ? (
                        <div
                          className={`h-0.5 min-w-[8px] flex-1 rounded-full transition-all duration-300 ${step > i + 1 ? "bg-emerald-500" : "bg-slate-200"}`}
                          aria-hidden
                        />
                      ) : (
                        <div className="min-w-[8px] flex-1" aria-hidden />
                      )}
                    </div>
                    <span
                      className={`mt-2 max-w-[5.5rem] text-center text-[11px] leading-tight sm:max-w-none sm:text-xs ${
                        step === i + 1 ? "font-medium text-slate-800" : step > i + 1 ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {ad}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-6 px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-7 xl:px-8">
        <div className="w-full lg:col-span-8 xl:col-span-9">
          {step === 1 ? (
            <div className={`flex min-h-[600px] flex-col ${STEP_CARD}`}>
              <h1 className={STEP_TITLE}>Rezervasyon Detayları</h1>
              <p className={`mb-6 ${STEP_SUB}`}>{listingTitle}</p>
              {fixedPackageNights ? (
                <p className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                  Bu paket için konaklama süresi sabittir: {fixedPackageNights} gece. Giriş tarihi seçtiğinizde çıkış tarihi otomatik belirlenir.
                </p>
              ) : null}

              <div ref={takvimRef} className="relative mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Tarihler
                  </label>
                  <button
                    type="button"
                    onClick={() => setAcikTakvim((prev) => (prev === "giris" ? null : "giris"))}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3.5 py-3 text-left text-sm font-medium text-slate-800 transition-all duration-200 ${
                      reservationInfo.giris_tarihi
                        ? "border-sky-500 bg-sky-50 ring-1 ring-sky-200/80"
                        : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40"
                    } ${acikTakvim === "giris" ? "border-sky-500 bg-sky-50 ring-2 ring-sky-400/30" : ""}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className={`${reservationInfo.giris_tarihi ? "text-slate-800" : "text-slate-400"} text-sm font-normal`}>
                          {reservationInfo.giris_tarihi
                            ? format(dateFromYmdLocal(reservationInfo.giris_tarihi), "d MMM yyyy", { locale: tr })
                            : "Giriş tarihi"}
                        </div>
                      </div>
                      {reservationInfo.giris_tarihi ? (
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                          {kisaGunAdi(reservationInfo.giris_tarihi)}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </div>
                <div>
                  <label className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    &nbsp;
                  </label>
                  <button
                    type="button"
                    onClick={() => setAcikTakvim((prev) => (prev === "cikis" ? null : "cikis"))}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3.5 py-3 text-left text-sm font-medium text-slate-800 transition-all duration-200 ${
                      reservationInfo.cikis_tarihi
                        ? "border-sky-500 bg-sky-50 ring-1 ring-sky-200/80"
                        : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40"
                    } ${acikTakvim === "cikis" ? "border-sky-500 bg-sky-50 ring-2 ring-sky-400/30" : ""}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                        <div className={`${reservationInfo.cikis_tarihi ? "text-slate-800" : "text-slate-400"} text-sm font-normal`}>
                          {reservationInfo.cikis_tarihi
                            ? format(dateFromYmdLocal(reservationInfo.cikis_tarihi), "d MMM yyyy", { locale: tr })
                            : "Çıkış tarihi"}
                        </div>
                      </div>
                      {reservationInfo.cikis_tarihi ? (
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                          {kisaGunAdi(reservationInfo.cikis_tarihi)}
                        </span>
                      ) : null}
                    </div>
                  </button>
                </div>

                {acikTakvim ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl md:left-0 md:right-auto md:w-[min(94vw,980px)]">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Tarih aralığını seçin</p>
                      <button
                        type="button"
                        onClick={() => setAcikTakvim(null)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600"
                      >
                        Kapat
                      </button>
                    </div>
                    <ClientDayPicker
                      mode="range"
                      locale={tr}
                      numberOfMonths={2}
                      selected={
                        reservationInfo.giris_tarihi && reservationInfo.cikis_tarihi
                          ? {
                              from: dateFromYmdLocal(reservationInfo.giris_tarihi),
                              to: dateFromYmdLocal(reservationInfo.cikis_tarihi),
                            }
                          : undefined
                      }
                      onSelect={(range) => {
                        if (range?.from) {
                          const from = `${range.from.getFullYear()}-${String(range.from.getMonth() + 1).padStart(2, "0")}-${String(range.from.getDate()).padStart(2, "0")}`;
                          const toDate = fixedPackageNights
                            ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate() + fixedPackageNights)
                            : range.to;
                          const to = toDate
                            ? `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, "0")}-${String(toDate.getDate()).padStart(2, "0")}`
                            : reservationInfo.cikis_tarihi;
                          setReservationInfo((prev) => ({ ...prev, giris_tarihi: from, cikis_tarihi: to }));
                        }
                      }}
                      disabled={{
                        before: dateFromYmdLocal(bugunIso),
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Misafirler
                </label>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {(
                    [
                      { label: "Yetişkin", desc: "13 yaş ve üzeri", key: "yetiskin" as const, min: 1, max: 20 },
                      { label: "Çocuk", desc: "2–12 yaş", key: "cocuk" as const, min: 0, max: 10 },
                      { label: "Bebek", desc: "0–2 yaş", key: "bebek" as const, min: 0, max: 5 },
                    ] as const
                  ).map(({ label, desc, key, min, max }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between border-b border-slate-100 py-4 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-normal text-slate-900">{label}</div>
                        <div className="text-xs text-slate-500">{desc}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setGuestInfo((prev) => ({
                              ...prev,
                              [key]: Math.max(min, prev[key] - 1),
                            }))
                          }
                          disabled={guestInfo[key] <= min}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-600 transition-all duration-200 ease-in-out hover:border-slate-300 hover:bg-slate-50 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-slate-900">{guestInfo[key]}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setGuestInfo((prev) => ({
                              ...prev,
                              [key]: Math.min(max, prev[key] + 1),
                            }))
                          }
                          disabled={guestInfo[key] >= max}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-600 transition-all duration-200 ease-in-out hover:border-slate-300 hover:bg-slate-50 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-3 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Özel İstek <span className="normal-case tracking-normal text-slate-400">(opsiyonel)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Erken giriş, özel dilek, doğum günü vb."
                  className={`min-h-[80px] w-full resize-none bg-white ${INPUT_FOCUS} placeholder:text-slate-400`}
                  value={ozelIstek}
                  onChange={(e) => setOzelIstek(e.target.value)}
                />
              </div>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    if (!validateStep1()) return;
                    setReservationInfo((prev) => ({
                      ...prev,
                      misafir_sayisi: guestInfo.yetiskin + guestInfo.cocuk,
                    }));
                    goToStep(2);
                  }}
                  className={`${BTN_PRIMARY} mt-8 w-full shadow-sm shadow-sky-600/20`}
                >
                  Devam Et
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
                {errorMessage ? (
                  <p className="slide-down-fade mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className={STEP_CARD}>
              <h2 className={STEP_TITLE}>Kişisel Bilgiler</h2>
              <p className={`mb-6 ${STEP_SUB}`}>Rezervasyon için iletişim bilgileriniz gereklidir</p>

              <form className="space-y-4" onSubmit={infoForm.handleSubmit(submitInfo)}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Ad *</label>
                    <input
                      type="text"
                      placeholder="Adınız"
                      className={`w-full ${INPUT_FOCUS}`}
                      {...infoForm.register("ad")}
                    />
                    <p className="text-xs text-red-500">{infoForm.formState.errors.ad?.message}</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Soyad *</label>
                    <input
                      type="text"
                      placeholder="Soyadınız"
                      className={`w-full ${INPUT_FOCUS}`}
                      {...infoForm.register("soyad")}
                    />
                    <p className="text-xs text-red-500">{infoForm.formState.errors.soyad?.message}</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">E-posta *</label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    className={`w-full ${INPUT_FOCUS}`}
                    {...infoForm.register("email")}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">Onay e-postası bu adrese gönderilecek</p>
                  <p className="text-xs text-red-500">{infoForm.formState.errors.email?.message}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Telefon *</label>
                  <div className="flex overflow-hidden rounded-lg border border-slate-200 transition-[box-shadow,border-color] focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-400/35">
                    <span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                      🇹🇷 +90
                    </span>
                    <input
                      type="tel"
                      placeholder="5XX XXX XX XX"
                      className="min-w-0 flex-1 border-0 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:ring-0"
                      {...infoForm.register("telefon")}
                    />
                  </div>
                  <p className="text-xs text-red-500">{infoForm.formState.errors.telefon?.message}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Özel İstek <span className="font-normal text-slate-400">(opsiyonel)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Erken giriş, özel dilek, doğum günü vb."
                    className={`w-full resize-none ${INPUT_FOCUS}`}
                    value={ozelIstek}
                    onChange={(e) => setOzelIstek(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button type="button" onClick={() => goToStep(1)} className={`${BTN_WHITE} w-full sm:flex-[1]`}>
                    Geri
                  </button>
                  <button type="submit" className={`${BTN_PRIMARY} w-full shadow-sm shadow-sky-600/20 sm:flex-[2]`}>
                    Ödeme Adımına Geç
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {step === 3 ? (
            <div className={STEP_CARD}>
              <h2 className={STEP_TITLE}>Ödeme</h2>
              <p className={`mb-6 ${STEP_SUB}`}>Güvenli ödeme yönteminizi seçin</p>

              <form className="space-y-4" onSubmit={paymentForm.handleSubmit(submitPayment)}>
                <div className="mb-6 space-y-3">
                  {(
                    [
                      {
                        val: "kart" as const,
                        baslik: "Kredi / Banka Kartı",
                        aciklama: "Visa, Mastercard, Troy",
                        Icon: CreditCard,
                      },
                      {
                        val: "havale" as const,
                        baslik: "Havale / EFT",
                        aciklama: "Banka transferiyle güvenli ödeme",
                        Icon: Landmark,
                      },
                    ] as const
                  ).map(({ val, baslik, aciklama, Icon }) => (
                    <label
                      key={val}
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all duration-200 ease-in-out ${
                        selectedPaymentMethod === val
                          ? "border-2 border-sky-600 bg-sky-50/70 shadow-sm shadow-sky-500/10"
                          : "border border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={val}
                        className="sr-only"
                        {...paymentForm.register("odeme_yontemi")}
                      />
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-sky-600">
                        <Icon className="h-8 w-8" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">{baslik}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{aciklama}</div>
                      </div>
                      {selectedPaymentMethod === val ? (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600">
                          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden />
                        </div>
                      ) : null}
                    </label>
                  ))}
                </div>

                {selectedPaymentMethod === "havale" ? (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-3 text-sm font-semibold text-amber-800">Havale Bilgileri</div>
                    <div className="space-y-2 text-sm text-amber-700">
                      <div className="flex justify-between gap-2">
                        <span className="text-amber-600">Banka</span>
                        <span className="font-medium">Garanti BBVA</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-amber-600">IBAN</span>
                        <span className="font-mono font-medium">TR00 0000 0000 0000 0000 00</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-amber-600">Hesap Adı</span>
                        <span className="font-medium">{SITE_NAME}</span>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-amber-200 pt-3 text-xs text-amber-600">
                      ⚠️ Açıklama kısmına referans numaranızı yazmayı unutmayın ({initialReferenceNo} örnek)
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-lg bg-slate-100 px-3 py-3">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                    <p className="min-w-0 text-left text-xs font-medium leading-snug text-slate-800">
                      SSL Güvenli / 256-bit şifreleme
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-slate-100 px-3 py-3">
                    <Award className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                    <p className="min-w-0 text-left text-xs font-medium leading-snug text-slate-800">
                      TURSAB / Belge No: {tursabNo}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-slate-100 px-3 py-3">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
                    <p className="min-w-0 text-left text-xs font-medium leading-snug text-slate-800">
                      Güvenli / İade garantisi
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <button type="button" onClick={() => goToStep(2)} className={`${BTN_WHITE} w-full sm:w-auto`}>
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={savingReservation}
                    className={`${BTN_PRIMARY} w-full flex-1 shadow-sm shadow-sky-600/20 disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {savingReservation ? (
                      <>
                        <span className="inline-spinner" aria-hidden />
                        <span className="sr-only">Yukleniyor</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
                        Rezervasyonu Tamamla
                      </>
                    )}
                  </button>
                </div>

                {errorMessage ? (
                  <p className="slide-down-fade rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
                ) : null}
              </form>
            </div>
          ) : null}

          {step === 4 ? (
            <div className={`${STEP_CARD} text-center`}>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-md shadow-emerald-500/25">
                <Check className="h-10 w-10 text-white" strokeWidth={2.5} aria-hidden />
              </div>

              <h2 className={`${STEP_TITLE} mb-2`}>Rezervasyonunuz Alındı!</h2>
              <p className={`mb-8 ${STEP_SUB}`}>
                Rezervasyon talebiniz başarıyla alındı.
              </p>

              <div className="mb-6 rounded-[12px] border border-sky-100/80 bg-gradient-to-br from-sky-50 via-white to-emerald-50/90 px-5 py-6 shadow-inner shadow-sky-100/50">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-sky-700/90">
                  Referans numaranız
                </div>
                <div className="text-2xl font-bold tracking-wide text-sky-700 sm:text-3xl">{referansGoster}</div>
                <p className="mt-2 text-xs text-slate-600">Bu numarayı kaydedin</p>
              </div>

              <div className="mb-6 overflow-hidden rounded-[12px] border border-slate-200 text-left">
                <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-900">
                  Rezervasyon detayları
                </div>
                <div className="divide-y divide-slate-200 text-sm">
                  <div className="flex justify-between gap-3 px-4 py-3">
                    <span className="text-slate-500">{packageSummary ? "Paket" : "İlan"}</span>
                    <span className="max-w-[58%] text-right font-medium text-slate-900">{listingTitle}</span>
                  </div>
                  {reservationInfo.giris_tarihi ? (
                    <div className="flex justify-between gap-3 px-4 py-3">
                      <span className="text-slate-500">Giriş</span>
                      <span className="font-medium text-slate-900">
                        {format(dateFromYmdLocal(reservationInfo.giris_tarihi), "d MMMM yyyy", {
                          locale: tr,
                        })}
                      </span>
                    </div>
                  ) : null}
                  {reservationInfo.cikis_tarihi ? (
                    <div className="flex justify-between gap-3 px-4 py-3">
                      <span className="text-slate-500">Çıkış</span>
                      <span className="font-medium text-slate-900">
                        {format(dateFromYmdLocal(reservationInfo.cikis_tarihi), "d MMMM yyyy", {
                          locale: tr,
                        })}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3 px-4 py-3">
                    <span className="text-slate-500">Misafir</span>
                    <span className="font-medium text-slate-900">
                      {guestInfo.yetiskin} yetişkin{guestInfo.cocuk > 0 ? `, ${guestInfo.cocuk} çocuk` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 bg-sky-50/50 px-4 py-4">
                    <span className="text-base font-semibold text-sky-800">Toplam</span>
                    <span className="text-lg font-bold text-sky-700">
                      ₺{totalPrice.total.toLocaleString("tr-TR")}
                    </span>
                  </div>
                </div>
              </div>

              {ozelIstek ? (
                <p className="mb-4 text-left text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Özel istek:</span> {ozelIstek}
                </p>
              ) : null}

              <div className="mb-4 text-xs text-slate-500">TURSAB Üyesidir — Belge No: {tursabNo}</div>

              <div
                className="mb-4 flex items-center gap-2.5 rounded-lg px-[18px] py-[14px] text-left"
                style={{ backgroundColor: "#E1F5EE", border: "0.5px solid #1D9E75" }}
              >
                <Mail className="h-5 w-5 shrink-0 text-[#1D9E75]" strokeWidth={2} aria-hidden />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-snug text-slate-800">
                    Rezervasyon bilgileriniz e-posta adresinize gönderildi.
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-slate-500">
                    Gelen kutunuzu kontrol edin, spam klasörüne düşmüş olabilir.
                  </p>
                </div>
              </div>
              {isPending ? <p className="mb-4 text-sm text-slate-500">Onay e-postası gönderiliyor…</p> : null}
              {errorMessage ? <p className="mb-4 text-sm text-red-600">{errorMessage}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/panel/rezervasyonlar"
                  onClick={() => {
                    rezervasyonStore.clear();
                    aramaStore.clear();
                  }}
                  className={`${BTN_WHITE} flex-1 text-center`}
                >
                  Rezervasyonlarım
                </Link>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BTN_BASE} flex-1 bg-[#1D9E75] text-white hover:brightness-[0.95] active:brightness-95`}
                >
                  WhatsApp İletişim
                </a>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 w-full lg:col-span-4 lg:mt-0 lg:w-96 xl:col-span-3">
          {step === 4 ? (
            <div className="rounded-[12px] border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 lg:sticky lg:top-6">
              <p className="text-[22px] font-medium text-slate-900">Özet</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Rezervasyon kaydınız oluşturuldu. Panelden takip edebilir veya WhatsApp üzerinden bize
                ulaşabilirsiniz.
              </p>
            </div>
          ) : (
            ozet
          )}
        </div>
      </div>
    </div>
  );
}
