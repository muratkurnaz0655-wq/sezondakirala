"use client";

import { useMemo, useRef, useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Search, Users } from "lucide-react";
import { ClientDayPicker } from "@/components/day-picker-client";
import { aramaStore } from "@/lib/arama-store";
import { dateFromYmdLocal } from "@/lib/tr-today";

type SearchFormProps = {
  /** İstanbul takvim günü YYYY-MM-DD (sunucu ile aynı üretilmeli) */
  bugunIso: string;
  className?: string;
  /** Katalog sayfaları: koyu şerit üzerinde beyaz kartlar + tersine hover arama butonu */
  catalogBar?: boolean;
  /** Beyaz kartın dışında (ör. ana sayfa stacked hero) kullanım — çift kutu ve backdrop kaldırılır */
  embedded?: boolean;
  initialGiris?: string;
  initialCikis?: string;
  initialYetiskin?: number;
  initialCocuk?: number;
  initialBebek?: number;
  initialGun?: number;
  /** Takvim alanını popup yerine form içinde sürekli açık gösterir */
  inlineDatePicker?: boolean;
  searchPath?: "/konaklama" | "/tekneler";
  submitLabel?: string;
  /** Dar sidebar kullanımlarında formu dikey ve daha geniş gösterir */
  forceVertical?: boolean;
};

function toDate(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toLocalIso(date?: Date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function GuestSteppers({
  yetiskin,
  setYetiskin,
  cocuk,
  setCocuk,
  bebek,
  setBebek,
  onUygula,
}: {
  yetiskin: number;
  setYetiskin: (n: number) => void;
  cocuk: number;
  setCocuk: (n: number) => void;
  bebek: number;
  setBebek: (n: number) => void;
  onUygula: () => void;
}) {
  return (
    <>
      {[
        { label: "Yetişkin", sub: "13 yaş üstü", value: yetiskin, setValue: setYetiskin, min: 1, max: 20 },
        { label: "Çocuk", sub: "2-12 yaş", value: cocuk, setValue: setCocuk, min: 0, max: 10 },
        { label: "Bebek", sub: "0-2 yaş", value: bebek, setValue: setBebek, min: 0, max: 5 },
      ].map((item) => (
        <div key={item.label} className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">{item.label}</p>
            <p className="text-xs text-slate-500">{item.sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50 text-slate-800 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              onClick={() => item.setValue(Math.max(item.min, item.value - 1))}
            >
              -
            </button>
            <span className="w-6 text-center text-sm">{item.value}</span>
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50 text-slate-800 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              onClick={() => item.setValue(Math.min(item.max, item.value + 1))}
            >
              +
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onUygula}
        className="w-full rounded-lg bg-[#1D9E75] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#0F6E56] active:scale-[0.98]"
      >
        Uygula
      </button>
    </>
  );
}

export function SearchForm({
  bugunIso,
  className,
  catalogBar = false,
  embedded = false,
  initialGiris,
  initialCikis,
  initialYetiskin = 2,
  initialCocuk = 0,
  initialBebek = 0,
  initialGun = 1,
  inlineDatePicker = false,
  searchPath = "/konaklama",
  submitLabel = "Villa Ara",
  forceVertical = false,
}: SearchFormProps) {
  const router = useRouter();
  const [giris, setGiris] = useState<Date | undefined>(toDate(initialGiris));
  const [cikis, setCikis] = useState<Date | undefined>(toDate(initialCikis));
  const [dateError, setDateError] = useState(false);
  const [openDates, setOpenDates] = useState(false);
  const [openGuests, setOpenGuests] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [yetiskin, setYetiskin] = useState(Math.max(1, initialYetiskin));
  const [cocuk, setCocuk] = useState(Math.max(0, initialCocuk));
  const [bebek, setBebek] = useState(Math.max(0, initialBebek));
  const [tekneGun, setTekneGun] = useState(Math.max(1, initialGun));
  const formRef = useRef<HTMLDivElement | null>(null);
  const guestWrapRef = useRef<HTMLDivElement | null>(null);
  const guestPopoverRef = useRef<HTMLDivElement | null>(null);
  const datePopoverRef = useRef<HTMLDivElement | null>(null);
  const dateButtonRef = useRef<HTMLButtonElement | null>(null);
  const inlineDatePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setGiris(toDate(initialGiris));
    setCikis(toDate(initialCikis));
  }, [initialGiris, initialCikis]);

  useEffect(() => {
    setYetiskin(Math.max(1, initialYetiskin));
    setCocuk(Math.max(0, initialCocuk));
    setBebek(Math.max(0, initialBebek));
    setTekneGun(Math.max(1, initialGun));
  }, [initialYetiskin, initialCocuk, initialBebek, initialGun]);

  useEffect(() => {
    function onDocPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const inGuest =
        Boolean(guestWrapRef.current?.contains(target)) ||
        Boolean(guestPopoverRef.current?.contains(target));
      const inDate =
        Boolean(datePopoverRef.current?.contains(target)) ||
        Boolean(dateButtonRef.current?.contains(target)) ||
        Boolean(inlineDatePanelRef.current?.contains(target));
      if (!inGuest) setOpenGuests(false);
      if (!inDate) setOpenDates(false);
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  useEffect(() => {
    function syncViewport() {
      setIsMobile(window.innerWidth < 768);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  /**
   * Hero (embedded) masaüstünde takvim formun içinde açılır.
   * Yalnızca mobilde overlay davranışı korunur.
   */
  const useOverlayDates = !inlineDatePicker && isMobile;
  const showEmbeddedInlineCalendar = embedded && !inlineDatePicker && !isMobile && openDates;

  useEffect(() => {
    if (!openDates || !useOverlayDates) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openDates, useOverlayDates]);

  const nightCount = useMemo(() => {
    if (!giris || !cikis) return 0;
    const diff = Math.ceil((cikis.getTime() - giris.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [giris, cikis]);

  const misafirOzeti = useMemo(() => {
    const parcalar: string[] = [];
    parcalar.push(`${yetiskin} yetişkin`);
    if (cocuk > 0) {
      parcalar.push(`${cocuk} çocuk`);
    }
    if (bebek > 0) {
      parcalar.push(`${bebek} bebek`);
    }
    return parcalar.join(", ");
  }, [yetiskin, cocuk, bebek]);

  function openCalendar() {
    if (inlineDatePicker) return;
    setOpenDates(true);
    setOpenGuests(false);
  }

  function openGuestPanel() {
    setOpenGuests((prev) => !prev);
    setOpenDates(false);
  }

  function submitSearch() {
    if (searchPath === "/tekneler") {
      if (!giris) {
        setDateError(true);
        return;
      }
      setDateError(false);
      aramaStore.save({
        giris: toLocalIso(giris),
        cikis: null,
        gun: tekneGun,
        yetiskin,
        cocuk: 0,
        bebek: 0,
        tip: "tekne",
      });
      document.cookie = `arama=${encodeURIComponent(
        JSON.stringify({
          giris: toLocalIso(giris),
          cikis: null,
          gun: tekneGun,
          yetiskin,
          cocuk: 0,
          bebek: 0,
          tip: "tekne",
        }),
      )}; path=/; max-age=86400; samesite=lax`;
      router.push("/tekneler");
      return;
    }

    if (!giris || !cikis) {
      setDateError(true);
      return;
    }
    setDateError(false);
    aramaStore.save({
      giris: toLocalIso(giris),
      cikis: toLocalIso(cikis),
      yetiskin,
      cocuk,
      bebek,
      tip: "villa",
    });
    document.cookie = `arama=${encodeURIComponent(
      JSON.stringify({
        giris: toLocalIso(giris),
        cikis: toLocalIso(cikis),
        yetiskin,
        cocuk,
        bebek,
        tip: "villa",
      }),
    )}; path=/; max-age=86400; samesite=lax`;
    router.push("/konaklama");
  }

  const shellClass = catalogBar
    ? "relative z-40 rounded-2xl border-0 bg-transparent p-0 text-slate-800 shadow-none"
    : embedded
      ? "relative z-[1] border-0 bg-transparent p-0 text-[#1E293B] shadow-none"
      : "relative z-[100] rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-2xl shadow-black/15 md:bg-white/95 md:p-2 md:backdrop-blur-xl";

  const shellStyle = catalogBar
    ? { isolation: "isolate" as const }
    : embedded
      ? { isolation: "isolate" as const }
      : { zIndex: 100 as const };

  const dateSecili = searchPath === "/tekneler" ? Boolean(giris) : Boolean(giris && cikis);
  const dayPickerClassNames = {
    months: "flex flex-row gap-4",
  } as const;

  const datePanelInner = (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
          <span className="rounded-lg bg-[#0e9aa7] px-3 py-1.5 text-xs font-semibold text-[#0d1117]">Tarih Seçimi</span>
          <span className="px-3 py-1.5 text-xs font-medium text-slate-500">Geniş Tarih Aralığı</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOpenDates(false);
              setOpenGuests(true);
            }}
            className="rounded-full border border-[#0e9aa7]/40 bg-[#f0fdfd] px-4 py-2 text-xs font-semibold text-[#0e9aa7] transition-all duration-200 hover:bg-[#ecfeff] hover:shadow-md active:scale-[0.98]"
          >
            Kişi seçimine devam et →
          </button>
          <button
            type="button"
            onClick={() => setOpenDates(false)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
          >
            Kapat
          </button>
        </div>
      </div>
      <ClientDayPicker
        mode="range"
        locale={tr}
        numberOfMonths={isMobile ? 1 : 2}
        classNames={dayPickerClassNames}
        selected={{ from: giris, to: cikis }}
        onSelect={(range) => {
          setGiris(range?.from);
          setCikis(range?.to);
          if (range?.from && range?.to) setDateError(false);
        }}
        disabled={{
          before: dateFromYmdLocal(bugunIso),
        }}
      />
    </>
  );

  const guestPanelInner = (
    <GuestSteppers
      yetiskin={yetiskin}
      setYetiskin={setYetiskin}
      cocuk={cocuk}
      setCocuk={setCocuk}
      bebek={bebek}
      setBebek={setBebek}
      onUygula={() => setOpenGuests(false)}
    />
  );

  return (
    <div className={className}>
      <div ref={formRef} className={shellClass} style={shellStyle}>
        {!embedded && !catalogBar ? (
          <>
            <div className="pointer-events-none absolute -left-16 -top-16 hidden h-40 w-40 rounded-full bg-sky-200/30 blur-2xl md:block" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 hidden h-40 w-40 rounded-full bg-emerald-200/25 blur-2xl md:block" />
          </>
        ) : null}

        <div
          className={`search-form-inner relative z-[1] flex flex-col gap-3 border ${
            catalogBar
              ? "md:flex-row md:items-stretch md:gap-3"
              : embedded
                ? "flex-col gap-3 md:flex-row md:items-stretch md:gap-3"
                : forceVertical
                  ? ""
                  : "md:flex-row md:items-stretch md:gap-0"
          } ${
            dateError ? "border-red-400 ring-1 ring-red-400" : "border-transparent"
          } ${embedded ? "rounded-none border-0 bg-transparent p-0" : ""}`}
        >
          <button
            ref={dateButtonRef}
            type="button"
            onClick={openCalendar}
            className={`flex min-h-[48px] flex-1 cursor-pointer touch-manipulation flex-col items-start text-left transition-colors ${
              catalogBar
                ? "rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm md:min-h-0 md:rounded-xl md:border md:px-4 md:py-3"
                : embedded
                  ? `rounded-lg border px-4 py-3 md:min-h-0 ${
                      dateSecili ? "border-[#1D9E75] bg-white" : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                    }`
                : forceVertical
                  ? "rounded-xl px-3 py-2"
                  : "rounded-xl px-3 py-2 md:min-h-0 md:rounded-none md:border-r md:px-4 md:py-3"
            } ${
              catalogBar
                ? dateSecili
                  ? "ring-2 ring-[#1D9E75]/80 ring-offset-2 ring-offset-transparent"
                  : "text-slate-600 ring-0"
                : embedded
                  ? ""
                  : "hover:bg-slate-50 md:border-slate-200"
            }`}
          >
            <div
              className={`${
                catalogBar
                  ? "text-xs font-medium text-slate-500"
                  : embedded
                    ? "text-[12px] font-semibold uppercase tracking-wide text-[#64748B]"
                    : "text-xs font-semibold uppercase text-slate-500"
              }`}
            >
              Tarihler
            </div>
            <div
              className={`mt-0.5 ${
                catalogBar
                  ? `text-[15px] font-medium ${dateSecili ? "text-slate-900" : "text-slate-500"} md:text-base`
                  : embedded
                    ? `text-[15px] font-medium ${dateSecili ? "text-[#1E293B]" : "text-[#64748B]"}`
                    : "text-sm font-medium text-slate-800 md:text-base"
              }`}
            >
              {searchPath === "/tekneler"
                ? giris
                  ? format(giris, "d MMM yyyy", { locale: tr })
                  : "Başlangıç seçin"
                : giris && cikis
                  ? `${format(giris, "d MMM", { locale: tr })} — ${format(cikis, "d MMM", { locale: tr })}`
                : inlineDatePicker
                  ? "Aşağıdaki takvimden seçin"
                  : "Tarih seçin"}
            </div>
            {searchPath !== "/tekneler" && nightCount > 0 ? (
              <p className={`mt-0.5 text-[12px] ${embedded ? "text-[#94A3B8]" : "text-slate-500"}`}>{nightCount} gece</p>
            ) : null}
          </button>

          {!catalogBar && !embedded ? (
            <div
              className={`hidden w-px shrink-0 self-stretch ${forceVertical ? "" : "md:block"} bg-slate-200`}
              aria-hidden
            />
          ) : null}

          <div
            className={`flex w-full flex-col gap-3 ${
              catalogBar ? "md:flex-1 md:flex-row md:items-stretch md:gap-3" : forceVertical ? "" : "sm:flex-row md:flex-1 md:items-stretch"
            }`}
          >
            <div ref={guestWrapRef} className="relative w-full min-w-0 flex-1 sm:flex-1">
              <button
                type="button"
                onClick={openGuestPanel}
                className={`min-h-[48px] w-full cursor-pointer touch-manipulation text-left transition-colors ${
                  catalogBar
                    ? "rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm md:min-h-0 md:rounded-xl md:border md:px-4 md:py-3"
                    : embedded
                      ? "rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 hover:border-[#CBD5E1] md:min-h-0"
                      : forceVertical
                        ? "rounded-xl px-3 py-2"
                        : "rounded-xl px-3 py-2 md:min-h-0 md:rounded-none md:border-r md:px-4 md:py-3"
                } ${
                  catalogBar
                    ? "ring-2 ring-transparent hover:ring-[#1D9E75]/25"
                    : embedded
                      ? ""
                      : "hover:bg-slate-50 md:border-slate-200"
                }`}
              >
                <div
                  className={`flex items-center gap-2 ${
                    catalogBar
                      ? "text-xs font-medium text-slate-500"
                      : embedded
                        ? "text-[12px] font-semibold uppercase tracking-wide text-[#64748B]"
                        : "text-xs font-semibold uppercase text-slate-500"
                  }`}
                >
                  <Users size={14} className={`shrink-0 ${catalogBar || embedded ? "text-[#1D9E75]" : "text-[#0e9aa7]"}`} aria-hidden />
                  Kişi
                </div>
                <div
                  className={`mt-0.5 text-left leading-snug ${
                    catalogBar
                      ? "text-[15px] font-medium text-slate-800 md:text-base"
                      : embedded
                        ? "text-[15px] font-medium text-[#1E293B]"
                        : "text-sm font-medium text-slate-800"
                  }`}
                >
                  {searchPath === "/tekneler" ? `${yetiskin} kişi` : misafirOzeti}
                </div>
              </button>
              {!isMobile && openGuests ? (
                <div
                  ref={guestPopoverRef}
                  className="absolute right-0 top-full z-[9999] mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-black/10"
                  style={{ zIndex: 9999 }}
                >
                  {guestPanelInner}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={submitSearch}
              className={`inline-flex min-h-12 w-full min-w-0 shrink-0 touch-manipulation items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors duration-200 active:scale-[0.98] ${
                catalogBar
                  ? "rounded-xl border-2 border-white bg-white font-semibold text-[#1D9E75] shadow-md hover:border-[#1D9E75] hover:bg-[#1D9E75] hover:text-white md:m-0 md:w-auto md:min-w-[140px] md:self-stretch"
                  : embedded
                    ? `rounded-lg bg-[#1D9E75] px-6 py-3 text-white shadow-sm hover:bg-[#0F6E56] md:m-0 md:min-h-12 md:w-auto md:min-w-[140px] md:self-stretch ${forceVertical ? "" : "sm:w-auto"}`
                    : `rounded-xl text-[#0d1117] shadow-lg shadow-[#0e9aa7]/30 hover:from-[#22d3ee] hover:to-[#0e9aa7] ${forceVertical ? "" : "sm:w-auto md:m-1"} btn-primary`
              }`}
              style={
                catalogBar || embedded
                  ? undefined
                  : {
                      background: "linear-gradient(to right, #0e9aa7, #22d3ee)",
                      minWidth: "112px",
                      borderRadius: "16px",
                    }
              }
            >
              <Search size={16} className={`inline ${catalogBar ? "text-current" : embedded ? "text-white" : "opacity-90"}`} aria-hidden />
              <span>{submitLabel}</span>
            </button>
          </div>
        </div>

        {searchPath === "/tekneler" ? (
          <div className="mt-3 grid gap-3 rounded-lg border border-[#E2E8F0] bg-white p-4 md:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">Kiralama Süresi</p>
              <select
                value={tekneGun}
                onChange={(e) => setTekneGun(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-medium text-[#1E293B] focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
              >
                <option value={1}>Günlük</option>
                <option value={2}>2 Günlük</option>
                <option value={3}>3 Günlük</option>
                <option value={7}>Haftalık</option>
                <option value={14}>2 Haftalık</option>
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">Kişi Sayısı</p>
              <input
                type="number"
                min={1}
                value={yetiskin}
                onChange={(e) => setYetiskin(Math.max(1, Number(e.target.value) || 1))}
                className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-medium text-[#1E293B] focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20"
              />
            </div>
          </div>
        ) : inlineDatePicker ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
            <p className="mb-3 text-sm font-medium text-slate-800">Takvimden tarih aralığını seçin</p>
            <ClientDayPicker
              mode="range"
              locale={tr}
              numberOfMonths={isMobile ? 1 : 2}
              classNames={dayPickerClassNames}
              selected={{ from: giris, to: cikis }}
              onSelect={(range) => {
                setGiris(range?.from);
                setCikis(range?.to);
                if (range?.from && range?.to) setDateError(false);
              }}
              disabled={{
                before: dateFromYmdLocal(bugunIso),
              }}
            />
          </div>
        ) : null}

        {showEmbeddedInlineCalendar ? (
          <div ref={inlineDatePanelRef} className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/10">
            {datePanelInner}
          </div>
        ) : null}
        {dateError ? (
          <p className="mt-2 text-sm text-red-600">
            {searchPath === "/tekneler"
              ? "Lütfen başlangıç tarihini seçin."
              : "Lütfen giriş ve çıkış tarihlerini seçin."}
          </p>
        ) : null}

        {!inlineDatePicker && !embedded && !useOverlayDates && openDates ? (
          <div
            ref={datePopoverRef}
            className="absolute left-0 right-0 top-full z-[9999] mx-auto mt-2 w-[min(92vw,620px)] max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-black/10 md:left-0 md:right-auto"
            style={{ zIndex: 9999 }}
          >
            {datePanelInner}
          </div>
        ) : null}
      </div>

      {mounted && isMobile && openGuests
        ? createPortal(
            <div
              className="fixed inset-0 z-[100000] flex flex-col justify-end bg-slate-900/40"
              role="presentation"
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setOpenGuests(false);
              }}
            >
              <div
                ref={guestPopoverRef}
                role="dialog"
                aria-modal="true"
                aria-label="Misafir sayısı"
                className="max-h-[min(88dvh,520px)] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <p className="mb-3 text-sm font-semibold text-slate-800">Misafir</p>
                {guestPanelInner}
              </div>
            </div>,
            document.body,
          )
        : null}

      {mounted && !inlineDatePicker && useOverlayDates && openDates
        ? createPortal(
            <div
              className={`fixed inset-0 z-[100000] flex bg-slate-900/40 ${
                isMobile ? "flex-col justify-end" : "items-center justify-center p-4"
              }`}
              role="presentation"
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setOpenDates(false);
              }}
            >
              <div
                ref={datePopoverRef}
                role="dialog"
                aria-modal="true"
                aria-label="Tarih seçimi"
                className={`overflow-y-auto border border-slate-200 bg-white p-4 shadow-2xl ${
                  isMobile
                    ? "max-h-[min(92dvh,640px)] rounded-t-2xl"
                    : "max-h-[min(88dvh,760px)] w-full max-w-[900px] rounded-2xl"
                }`}
                style={isMobile ? { paddingBottom: "max(1rem, env(safe-area-inset-bottom))" } : undefined}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {datePanelInner}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
