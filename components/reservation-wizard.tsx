"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { createReservation, sendReservationConfirmation } from "@/app/actions/reservation";
import { aramaStore, rezervasyonStore } from "@/lib/arama-store";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME, WHATSAPP_NUMBER } from "@/lib/constants";
import { CalendarDays, Check, Info, MapPin, Users } from "lucide-react";
import { ClientDayPicker } from "@/components/day-picker-client";
import { dateFromYmdLocal } from "@/lib/tr-today";

const FALLBACK_KAPAK =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80";

function referansSayiEki(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(1000 + (buf[0]! % 9000));
}

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
    <div className="sticky top-6 w-full self-start overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative h-44 w-full overflow-hidden rounded-t-xl">
        <Image src={kapak} alt={baslik} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 360px" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-md border border-white/30 bg-black/25 px-2 py-1 text-xs font-normal text-white">
          {konum || "Konum yok"}
        </span>
      </div>

      <div className="p-5">
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

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const referenceNo = `SZK-${stamp}-${referansSayiEki()}`;
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
        setErrorMessage(createResult.error);
        return;
      }

      setConfirmationRef(referenceNo);
      setReservationInfo((prev) => ({ ...prev, misafir_sayisi: misafirSayisi }));
      goToStep(4);

      startTransition(async () => {
        const result = await sendReservationConfirmation({
          email: userInfo.email,
          adSoyad: `${userInfo.ad} ${userInfo.soyad}`,
          referansNo: referenceNo,
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
      <div className="sticky top-0 z-20 border-b border-sky-100/70 bg-white/90 backdrop-blur-md">
        <div className="w-full border-b border-slate-100 bg-white px-4 py-4 xl:px-8">
          <div className="flex max-w-none items-center gap-6">
            <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Adım {step} / 4
            </div>
            <div className="flex flex-1 items-center">
              {stepTitles.map((ad, i) => (
                <Fragment key={ad}>
                  <div className="flex flex-col items-center gap-1">
                    {canNavigateToStep(i + 1) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          goToStep(i + 1);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium ${
                          step > i + 1
                            ? "border-sky-500 bg-sky-500 text-white"
                            : step === i + 1
                              ? "border-sky-500 bg-sky-500 text-white"
                              : "border-slate-300 bg-white text-slate-400"
                        }`}
                        aria-label={`${i + 1}. adıma dön`}
                      >
                        {step > i + 1 ? "✓" : i + 1}
                      </button>
                    ) : (
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium ${
                          step > i + 1
                            ? "border-sky-500 bg-sky-500 text-white"
                            : step === i + 1
                              ? "border-sky-500 bg-sky-500 text-white"
                              : "border-slate-300 bg-white text-slate-400"
                        }`}
                      >
                        {step > i + 1 ? "✓" : i + 1}
                      </div>
                    )}
                    <span
                      className={`hidden whitespace-nowrap text-xs sm:block ${
                        step === i + 1 ? "font-medium text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {ad}
                    </span>
                  </div>
                  {i < stepTitles.length - 1 ? (
                    <div className={`mx-2 mb-4 h-px flex-1 ${step > i + 1 ? "bg-sky-400" : "bg-slate-200"}`} />
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-6 px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-7 xl:px-8">
        <div className="w-full lg:col-span-8 xl:col-span-9">
          {step === 1 ? (
            <div className="flex min-h-[600px] flex-col rounded-xl border border-slate-200 bg-white p-7">
              <h1 className="text-xl font-medium text-slate-800">Rezervasyon Detayları</h1>
              <p className="mb-6 mt-0.5 text-sm text-slate-500">{listingTitle}</p>
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
                    className={`flex w-full items-center gap-2 rounded-lg border px-3.5 py-3 text-left text-sm font-medium text-slate-800 transition-all ${
                      reservationInfo.giris_tarihi
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
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
                    className={`flex w-full items-center gap-2 rounded-lg border px-3.5 py-3 text-left text-sm font-medium text-slate-800 transition-all ${
                      reservationInfo.cikis_tarihi
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
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
                <div className="overflow-hidden rounded-lg border border-slate-200">
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
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-600 transition-all duration-200 hover:border-sky-400 hover:bg-sky-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-normal text-slate-900">{guestInfo[key]}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setGuestInfo((prev) => ({
                              ...prev,
                              [key]: Math.min(max, prev[key] + 1),
                            }))
                          }
                          disabled={guestInfo[key] >= max}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-600 transition-all duration-200 hover:border-sky-400 hover:bg-sky-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
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
                  className="min-h-[80px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-sky-300 focus:bg-white focus:outline-none"
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
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:bg-sky-600 active:scale-[0.98]"
                >
                  Devam Et →
                </button>
                {errorMessage ? (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] md:p-10">
              <h2 className="mb-1 text-xl font-bold text-gray-900">Kişisel Bilgiler</h2>
              <p className="mb-6 text-sm text-gray-500">Rezervasyon için iletişim bilgileriniz gereklidir</p>

              <form className="space-y-4" onSubmit={infoForm.handleSubmit(submitInfo)}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Ad *</label>
                    <input
                      type="text"
                      placeholder="Adınız"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      {...infoForm.register("ad")}
                    />
                    <p className="text-xs text-red-500">{infoForm.formState.errors.ad?.message}</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Soyad *</label>
                    <input
                      type="text"
                      placeholder="Soyadınız"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      {...infoForm.register("soyad")}
                    />
                    <p className="text-xs text-red-500">{infoForm.formState.errors.soyad?.message}</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">E-posta *</label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    {...infoForm.register("email")}
                  />
                  <p className="mt-1 text-xs text-gray-400">Onay e-postası bu adrese gönderilecek</p>
                  <p className="text-xs text-red-500">{infoForm.formState.errors.email?.message}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Telefon *</label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                      🇹🇷 +90
                    </span>
                    <input
                      type="tel"
                      placeholder="5XX XXX XX XX"
                      className="flex-1 rounded-r-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                      {...infoForm.register("telefon")}
                    />
                  </div>
                  <p className="text-xs text-red-500">{infoForm.formState.errors.telefon?.message}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Özel İstek <span className="font-normal text-gray-400">(opsiyonel)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Erken giriş, özel dilek, doğum günü vb."
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    value={ozelIstek}
                    onChange={(e) => setOzelIstek(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                  >
                    ← Geri
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:bg-sky-600 active:scale-[0.98]"
                  >
                    Ödeme adımına geç
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] md:p-10">
              <h2 className="mb-1 text-xl font-bold text-gray-900">Ödeme</h2>
              <p className="mb-6 text-sm text-gray-500">Güvenli ödeme yönteminizi seçin</p>

              <form className="space-y-4" onSubmit={paymentForm.handleSubmit(submitPayment)}>
                <div className="mb-6 space-y-3">
                  {(
                    [
                      {
                        val: "kart" as const,
                        baslik: "Kredi / Banka Kartı",
                        aciklama: "Visa, Mastercard, Troy",
                        ikon: "💳",
                      },
                      {
                        val: "havale" as const,
                        baslik: "Havale / EFT",
                        aciklama: "Banka transferiyle güvenli ödeme",
                        ikon: "🏦",
                      },
                    ] as const
                  ).map(({ val, baslik, aciklama, ikon }) => (
                    <label
                      key={val}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                        selectedPaymentMethod === val
                          ? "border-sky-500 bg-sky-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={val}
                        className="h-4 w-4 accent-sky-500"
                        {...paymentForm.register("odeme_yontemi")}
                      />
                      <span className="text-2xl">{ikon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{baslik}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{aciklama}</div>
                      </div>
                      {selectedPaymentMethod === val ? (
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-500">
                          <Check size={12} className="text-white" strokeWidth={3} />
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
                  {(
                    [
                      { ikon: "🔒", baslik: "SSL Güvenli", aciklama: "256-bit şifreleme" },
                      { ikon: "✅", baslik: "TURSAB", aciklama: `Belge No: ${tursabNo}` },
                      { ikon: "💯", baslik: "Güvenli", aciklama: "İade garantisi" },
                    ] as const
                  ).map(({ ikon, baslik, aciklama }) => (
                    <div key={baslik} className="rounded-xl bg-gray-50 p-3 text-center">
                      <div className="mb-1 text-xl">{ikon}</div>
                      <div className="text-xs font-semibold text-gray-900">{baslik}</div>
                      <div className="mt-0.5 text-xs text-gray-400">{aciklama}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                  >
                    ← Geri
                  </button>
                  <button
                    type="submit"
                    disabled={savingReservation}
                    className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:bg-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingReservation ? "Kaydediliyor…" : "Rezervasyonu tamamla"}
                  </button>
                </div>

                {errorMessage ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
                ) : null}
              </form>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] md:p-12">
              <div className="mx-auto mb-6 flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-green-100">
                <Check size={36} className="text-green-600" strokeWidth={2.5} />
              </div>

              <h2 className="mb-2 text-2xl font-bold text-gray-900">Rezervasyonunuz Alındı! 🎉</h2>
              <p className="mb-8 text-gray-500">
                En kısa sürede sizi arayarak rezervasyonunuzu onaylayacağız.
              </p>

              <div className="mb-6 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 p-5">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-600">
                  Referans Numaranız
                </div>
                <div className="text-3xl font-black tracking-wider text-sky-700">{referansGoster}</div>
                <div className="mt-2 text-xs text-sky-500">Bu numarayı kaydedin</div>
              </div>

              <div className="mb-6 rounded-xl bg-gray-50 p-4 text-left">
                <div className="mb-3 font-semibold text-gray-900">📋 Rezervasyon Detayları</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">{packageSummary ? "Paket" : "İlan"}</span>
                    <span className="max-w-[60%] text-right font-medium text-gray-900">{listingTitle}</span>
                  </div>
                  {reservationInfo.giris_tarihi ? (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Giriş</span>
                      <span className="font-medium">
                        {format(dateFromYmdLocal(reservationInfo.giris_tarihi), "d MMMM yyyy", {
                          locale: tr,
                        })}
                      </span>
                    </div>
                  ) : null}
                  {reservationInfo.cikis_tarihi ? (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Çıkış</span>
                      <span className="font-medium">
                        {format(dateFromYmdLocal(reservationInfo.cikis_tarihi), "d MMMM yyyy", {
                          locale: tr,
                        })}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Misafir</span>
                    <span className="font-medium">
                      {guestInfo.yetiskin} yetişkin{guestInfo.cocuk > 0 ? `, ${guestInfo.cocuk} çocuk` : ""}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
                    <span className="font-bold text-gray-900">Toplam</span>
                    <span className="text-base font-bold text-sky-600">
                      ₺{totalPrice.total.toLocaleString("tr-TR")}
                    </span>
                  </div>
                </div>
              </div>

              {ozelIstek ? (
                <p className="mb-4 text-left text-sm text-gray-600">
                  <span className="font-medium">Özel istek:</span> {ozelIstek}
                </p>
              ) : null}

              <div className="mb-6 text-xs text-gray-400">TURSAB Üyesidir — Belge No: {tursabNo}</div>

              <p className="mb-4 text-sm text-gray-600">Onay e-postası gönderildi.</p>
              {isPending ? <p className="mb-4 text-sm text-gray-500">Onay e-postası gönderiliyor…</p> : null}
              {errorMessage ? <p className="mb-4 text-sm text-red-600">{errorMessage}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/panel/rezervasyonlar"
                  onClick={() => {
                    rezervasyonStore.clear();
                    aramaStore.clear();
                  }}
                  className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                >
                  📅 Rezervasyonlarım
                </Link>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-green-500 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-600"
                >
                  💬 WhatsApp İletişim
                </a>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 w-full lg:col-span-4 lg:mt-0 lg:w-96 xl:col-span-3">
          {step === 4 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 text-sm text-gray-600 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.45)] lg:sticky lg:top-6">
              <p className="font-medium text-gray-900">Özet</p>
              <p className="mt-2">
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
