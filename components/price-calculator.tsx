"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import type { DateRange, DayButtonProps } from "react-day-picker";
import { tr } from "date-fns/locale";
import { TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { ClientDayPicker } from "@/components/day-picker-client";
import { dateFromYmdLocal } from "@/lib/tr-today";

type AvailabilityRow = {
  tarih: string;
  durum: "musait" | "dolu" | "ozel_fiyat";
  fiyat_override: number | null;
};

type SeasonPriceRow = {
  baslangic_tarihi: string;
  bitis_tarihi: string;
  gunluk_fiyat: number;
};

type ReservationRow = {
  giris_tarihi: string;
  cikis_tarihi: string;
  durum: "beklemede" | "onaylandi" | "iptal";
};

type PriceCalculatorProps = {
  /** Sunucuda üretilen İstanbul takvim günü (YYYY-MM-DD); SSR ile ilk istemci boyaması aynı kalır */
  bugunIso: string;
  gunlukFiyat: number;
  kapasite: number;
  availability: AvailabilityRow[];
  seasonPrices: SeasonPriceRow[];
  reservations: ReservationRow[];
  /** Arama / liste URL’sinden gelen aralık — takvim ve toplam fiyat baştan dolu */
  initialGiris?: string;
  initialCikis?: string;
  sectionId?: string;
};

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

/** Takvim günü — yerel tarih (UTC `toISOString` gecelik fiyat anahtarını kaydırırdı) */
function toLocalYmd(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function nightlyPriceFor(
  iso: string,
  gunlukFiyat: number,
  availability: AvailabilityRow[],
  seasonPrices: SeasonPriceRow[],
) {
  const override = availability.find(
    (item) => item.tarih === iso && item.fiyat_override != null,
  )?.fiyat_override;
  const season = seasonPrices.find(
    (item) => iso >= item.baslangic_tarihi && iso <= item.bitis_tarihi,
  )?.gunluk_fiyat;
  return override ?? season ?? gunlukFiyat;
}

function createPriceDayButton(priceMap: Record<string, number>) {
  return function PriceDayButton(props: DayButtonProps) {
    const { day, modifiers, ...buttonProps } = props;
    const ref = useRef<HTMLButtonElement>(null);
    useEffect(() => {
      if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);
    const iso = toLocalYmd(day.date);
    /** Yalnızca bu gecenin gecelik fiyatı (aralık toplamı / birikim değil) */
    const gunFiyati = priceMap[iso];
    const mergedClass = [buttonProps.className, "flex min-h-11 flex-col items-center justify-center gap-0.5 py-0.5"]
      .filter(Boolean)
      .join(" ");
    return (
      <button ref={ref} type="button" {...buttonProps} className={mergedClass}>
        <span className="text-sm leading-tight">{day.date.getDate()}</span>
        {gunFiyati != null ? (
          <span className="text-[9px] leading-none text-sky-600">{(gunFiyati / 1000).toFixed(1)}k</span>
        ) : (
          <span className="pointer-events-none text-[9px] leading-none opacity-0">0</span>
        )}
      </button>
    );
  };
}

function initialRangeFromYmd(
  giris?: string,
  cikis?: string,
): DateRange | undefined {
  if (!giris?.trim() || !cikis?.trim()) return undefined;
  const from = toDate(giris);
  const toD = toDate(cikis);
  if (Number.isNaN(from.getTime()) || Number.isNaN(toD.getTime())) return undefined;
  return { from, to: toD };
}

export function PriceCalculator({
  bugunIso,
  gunlukFiyat,
  kapasite,
  availability,
  seasonPrices,
  reservations,
  initialGiris,
  initialCikis,
  sectionId,
}: PriceCalculatorProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(() =>
    initialRangeFromYmd(initialGiris, initialCikis),
  );
  const [monthCount, setMonthCount] = useState(2);

  useEffect(() => {
    function sync() {
      setMonthCount(window.innerWidth < 768 ? 1 : 2);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const blockedDays = useMemo(() => {
    const fromAvailability = availability
      .filter((item) => item.durum === "dolu")
      .map((item) => toDate(item.tarih));

    const fromReservations = reservations.flatMap((item) => {
      if (item.durum === "iptal") return [];
      const start = toDate(item.giris_tarihi);
      const end = toDate(item.cikis_tarihi);
      end.setDate(end.getDate() - 1);
      const days: Date[] = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      return days;
    });

    return [...fromAvailability, ...fromReservations];
  }, [availability, reservations]);

  const specialPriceDays = useMemo(() => {
    const fromAvailability = availability
      .filter((item) => item.durum === "ozel_fiyat")
      .map((item) => toDate(item.tarih));

    const fromSeasons = seasonPrices.flatMap((item) => {
      const start = toDate(item.baslangic_tarihi);
      const end = toDate(item.bitis_tarihi);
      const days: Date[] = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      return days;
    });

    return [...fromAvailability, ...fromSeasons];
  }, [availability, seasonPrices]);

  const priceMap = useMemo(() => {
    const map: Record<string, number> = {};
    const start = dateFromYmdLocal(bugunIso);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    const cursor = new Date(start);
    while (cursor <= end) {
      const iso = toLocalYmd(cursor);
      map[iso] = nightlyPriceFor(iso, gunlukFiyat, availability, seasonPrices);
      cursor.setDate(cursor.getDate() + 1);
    }
    return map;
  }, [availability, bugunIso, gunlukFiyat, seasonPrices]);

  const DayButtonWithPrices = useMemo(() => createPriceDayButton(priceMap), [priceMap]);

  const pricing = useMemo(() => {
    if (!selectedRange?.from || !selectedRange?.to) {
      return { dayCount: 0, nightsTotal: 0, total: 0, average: 0 };
    }

    const from = selectedRange.from;
    const to = selectedRange.to;
    const dayCount = Math.max(1, differenceInCalendarDays(to, from));
    const nightlyPrices: number[] = [];
    const cursor = new Date(from);

    while (cursor < to) {
      const iso = toLocalYmd(cursor);
      nightlyPrices.push(nightlyPriceFor(iso, gunlukFiyat, availability, seasonPrices));
      cursor.setDate(cursor.getDate() + 1);
    }

    const nightsTotal = nightlyPrices.reduce((sum, price) => sum + price, 0);
    const average = nightlyPrices.length ? Math.round(nightsTotal / nightlyPrices.length) : 0;
    return {
      dayCount,
      nightsTotal,
      average,
      total: nightsTotal,
    };
  }, [availability, gunlukFiyat, seasonPrices, selectedRange]);

  const perPerson =
    pricing.total > 0 && kapasite > 0 ? Math.round(pricing.total / kapasite) : 0;

  return (
    <div id={sectionId} className="relative z-[50] overflow-visible rounded-2xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">Tarih ve Fiyat Hesaplayıcı</h3>
      <div className="relative z-[50] overflow-visible">
        <ClientDayPicker
          mode="range"
          locale={tr}
          numberOfMonths={monthCount}
          className="mx-auto"
          selected={selectedRange}
          onSelect={setSelectedRange}
          disabled={[{ before: dateFromYmdLocal(bugunIso) }, ...blockedDays]}
          modifiers={{ dolu: blockedDays, ozelFiyat: specialPriceDays }}
          modifiersClassNames={{
            ozelFiyat: "rounded-lg bg-blue-50 text-blue-700",
            selected: "rounded-lg bg-blue-600 font-bold text-white",
            range_middle: "bg-blue-50 text-blue-700",
            today: "text-blue-600 font-semibold hover:bg-blue-50 rounded-lg",
            dolu: "cursor-not-allowed text-slate-300 line-through",
          }}
          modifiersStyles={{
            dolu: {
              backgroundColor: "transparent",
            },
          }}
          components={{
            DayButton: DayButtonWithPrices,
          }}
        />
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {selectedRange?.from && selectedRange?.to
          ? `${format(selectedRange.from, "dd MMMM yyyy", { locale: tr })} - ${format(selectedRange.to, "dd MMMM yyyy", { locale: tr })}`
          : "Giriş ve çıkış için bir tarih aralığı seçin"}
      </p>
      {pricing.dayCount > 0 ? (
        <>
          {perPerson > 0 ? (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="mb-1 flex items-center gap-2 font-semibold text-green-700">
                <TrendingDown size={16} aria-hidden />
                Kişi başına maliyet hesabı
              </div>
              <p className="text-sm text-green-600">
                {kapasite} kişi kapasiteye göre:{" "}
                <strong>₺{perPerson.toLocaleString("tr-TR")}</strong> kişi başı (toplam / kapasite) — 5
                yıldızlı otele kıyasla genelde daha uygun
              </p>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between text-sm text-slate-700">
            <span>
              {pricing.dayCount} gece × ort. {formatCurrency(pricing.average)}
            </span>
            <span>{formatCurrency(pricing.nightsTotal)}</span>
          </div>
          <hr className="my-3 border-slate-200" />
          <div className="flex justify-between text-lg font-semibold text-slate-900">
            <span>Toplam</span>
            <span>{formatCurrency(pricing.total)}</span>
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Fiyat görmek için tarih seçin.</p>
      )}
      <p className="mt-3 text-center text-xs text-slate-400">
        Benzer villalar: ₺{Math.round(gunlukFiyat * 0.8).toLocaleString("tr-TR")} – ₺
        {Math.round(gunlukFiyat * 1.3).toLocaleString("tr-TR")}
        /gece
      </p>
    </div>
  );
}
