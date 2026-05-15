"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { tr } from "date-fns/locale";
import { Building2, Tag } from "lucide-react";
import {
  createOwnerSeasonPrice,
  deleteOwnerSeasonPrice,
  setOwnerAvailabilityRange,
} from "@/app/actions/owner";
import { ClientDayPicker } from "@/components/day-picker-client";
import { PanelDateRangeField } from "@/components/panel/panel-date-range-field";
import {
  PANEL_CARD_CLASS,
  PANEL_DAY_PICKER_CLASS,
  PANEL_INPUT_CLASS,
} from "@/components/panel/panel-day-picker-styles";
import { formatTurkishDateRange } from "@/lib/format-turkish-date";
import { ymdFromLocalDate } from "@/lib/availability-dates";
import { dateFromYmdLocal } from "@/lib/tr-today";
import { formatCurrency } from "@/lib/utils/format";

type Listing = { id: string; baslik: string };
type Availability = {
  id: string;
  ilan_id: string;
  tarih: string;
  durum: string;
  fiyat_override?: number | null;
};
type SeasonPrice = {
  id: string;
  ilan_id: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  gunluk_fiyat: number;
};
type Reservation = {
  id: string;
  ilan_id: string;
  giris_tarihi: string;
  cikis_tarihi: string;
  durum: string;
};

type Props = {
  listings: Listing[];
  defaultListingId?: string;
  availability: Availability[];
  seasonPrices: SeasonPrice[];
  reservations: Reservation[];
};

const DURUM_LABEL: Record<string, string> = {
  dolu: "Dolu",
  musait: "Müsait",
  ozel_fiyat: "Özel fiyat",
};

function resolveInitialListingId(preferred: string | undefined, listings: Listing[]) {
  if (preferred && listings.some((l) => l.id === preferred)) return preferred;
  return listings[0]?.id ?? "";
}

function toDate(value: string) {
  return dateFromYmdLocal(value);
}

function createRangeDates(start: string, end: string) {
  const dates: Date[] = [];
  const current = toDate(start);
  const endDate = toDate(end);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function rangeToYmd(range: DateRange | undefined) {
  if (!range?.from) return null;
  let from = ymdFromLocalDate(range.from);
  let to = ymdFromLocalDate(range.to ?? range.from);
  if (from > to) {
    const t = from;
    from = to;
    to = t;
  }
  return { from, to };
}

export function OwnerCalendarManager({
  listings,
  defaultListingId,
  availability,
  seasonPrices,
  reservations,
}: Props) {
  const router = useRouter();
  const [selectedListingId, setSelectedListingId] = useState(() =>
    resolveInitialListingId(defaultListingId, listings),
  );
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [seasonRange, setSeasonRange] = useState<DateRange | undefined>();
  const [overridePrice, setOverridePrice] = useState("");
  const [seasonPrice, setSeasonPrice] = useState("");
  const [islem, setIslem] = useState<"dolu" | "musait" | "ozel_fiyat">("dolu");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [monthCount, setMonthCount] = useState(2);

  useEffect(() => {
    setSelectedListingId(resolveInitialListingId(defaultListingId, listings));
  }, [defaultListingId, listings]);

  useEffect(() => {
    function sync() {
      setMonthCount(window.innerWidth < 768 ? 1 : 2);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const filteredAvailability = availability.filter((item) => item.ilan_id === selectedListingId);
  const filteredSeasonPrices = seasonPrices.filter((item) => item.ilan_id === selectedListingId);
  const filteredReservations = reservations.filter(
    (item) => item.ilan_id === selectedListingId && item.durum === "onaylandi",
  );

  const { doluDays, ozelFiyatDays, onayliRezervasyonDays } = useMemo(() => {
    const dolu = filteredAvailability
      .filter((item) => item.durum === "dolu")
      .map((item) => toDate(item.tarih));
    const ozel = filteredAvailability
      .filter((item) => item.durum === "ozel_fiyat")
      .map((item) => toDate(item.tarih));
    const rezervasyon = filteredReservations.flatMap((item) => {
      const end = toDate(item.cikis_tarihi);
      end.setDate(end.getDate() - 1);
      if (end < toDate(item.giris_tarihi)) return [];
      return createRangeDates(item.giris_tarihi, ymdFromLocalDate(end));
    });
    return {
      doluDays: dolu,
      ozelFiyatDays: ozel,
      onayliRezervasyonDays: rezervasyon,
    };
  }, [filteredAvailability, filteredReservations]);

  const selectedListing = listings.find((l) => l.id === selectedListingId);

  function handleKaydet() {
    const range = rangeToYmd(selectedRange);
    if (!range || !selectedListingId) {
      setMessage("Önce takvimden bir tarih veya aralık seçin.");
      return;
    }
    if (islem === "ozel_fiyat" && !overridePrice.trim()) {
      setMessage("Özel fiyat için gecelik tutar girin.");
      return;
    }

    startTransition(async () => {
      const result = await setOwnerAvailabilityRange({
        ilanId: selectedListingId,
        baslangicTarihi: range.from,
        bitisTarihi: range.to,
        durum: islem,
        fiyatOverride:
          islem === "ozel_fiyat" && overridePrice ? Number(overridePrice) : null,
      });
      if (result.success) {
        setMessage("Takvim güncellendi.");
        setSelectedRange(undefined);
        router.refresh();
      } else {
        setMessage(result.error ?? "İşlem başarısız.");
      }
    });
  }

  function handleSeasonPrice() {
    const range = rangeToYmd(seasonRange);
    if (!range || !selectedListingId || !seasonPrice.trim()) {
      setMessage("Sezon fiyatı için tarih aralığı ve gecelik fiyat girin.");
      return;
    }

    startTransition(async () => {
      const result = await createOwnerSeasonPrice({
        ilanId: selectedListingId,
        baslangicTarihi: range.from,
        bitisTarihi: range.to,
        gunlukFiyat: Number(seasonPrice),
      });
      setMessage(
        result.success ? "Sezon fiyatı kaydedildi." : (result.error ?? "Sezon fiyatı kaydedilemedi."),
      );
      if (result.success) {
        setSeasonRange(undefined);
        setSeasonPrice("");
        router.refresh();
      }
    });
  }

  function removeSeasonPrice(id: string) {
    startTransition(async () => {
      const result = await deleteOwnerSeasonPrice(id);
      setMessage(
        result.success ? "Sezon fiyatı silindi." : (result.error ?? "Sezon fiyatı silinemedi."),
      );
      if (result.success) router.refresh();
    });
  }

  const displayRange =
    selectedRange?.from != null
      ? { from: selectedRange.from, to: selectedRange.to ?? selectedRange.from }
      : null;

  if (!listings.length) {
    return (
      <div className={`${PANEL_CARD_CLASS} text-center`}>
        <p className="text-sm font-medium text-slate-800">Henüz ilanınız yok</p>
        <p className="mt-1 text-sm text-slate-600">
          Takvim yönetimi için önce bir ilan oluşturun.
        </p>
        <Link
          href="/panel/ilanlarim/yeni"
          className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Yeni ilan ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={PANEL_CARD_CLASS}>
        <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Building2 className="h-4 w-4 text-sky-600" aria-hidden />
          İlan seçimi
        </label>
        <select
          className={PANEL_INPUT_CLASS}
          value={selectedListingId}
          onChange={(e) => {
            setSelectedListingId(e.target.value);
            setSelectedRange(undefined);
            setMessage(null);
          }}
        >
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.baslik}
            </option>
          ))}
        </select>
        {selectedListing ? (
          <p className="mt-2 text-xs text-slate-500">
            Seçili: <span className="font-medium text-slate-700">{selectedListing.baslik}</span>
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${PANEL_CARD_CLASS} ${PANEL_DAY_PICKER_CLASS}`}>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Takvim</h2>
          <ClientDayPicker
            mode="range"
            locale={tr}
            numberOfMonths={monthCount}
            selected={selectedRange}
            onSelect={setSelectedRange}
            modifiers={{
              dolu: doluDays,
              ozel: ozelFiyatDays,
              rezervasyon: onayliRezervasyonDays,
            }}
            modifiersClassNames={{
              dolu: "rounded-md bg-red-100 font-medium text-red-900",
              ozel: "rounded-md bg-amber-100 font-medium text-amber-900",
              rezervasyon: "rounded-md bg-sky-100 font-medium text-sky-900",
            }}
          />
        </div>

        <div className={PANEL_CARD_CLASS}>
          <h2 className="mb-1 text-sm font-semibold text-slate-900">İşlem seçin</h2>
          <p className="mb-4 text-xs text-slate-500">
            Takvimde gün veya aralık seçip aşağıdan işlemi uygulayın.
          </p>

          <div className="mb-5 space-y-2.5">
            {(
              [
                {
                  val: "dolu" as const,
                  label: "Dolu işaretle",
                  desc: "Bu günler rezervasyona kapalı olur",
                  active: "border-red-500 bg-red-50 ring-1 ring-red-100",
                  idle: "border-slate-200 bg-white hover:border-red-200",
                },
                {
                  val: "musait" as const,
                  label: "Müsait yap",
                  desc: "Dolu veya özel fiyat işaretini kaldırır",
                  active: "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-100",
                  idle: "border-slate-200 bg-white hover:border-emerald-200",
                },
                {
                  val: "ozel_fiyat" as const,
                  label: "Özel fiyat",
                  desc: "Seçilen günlere özel gecelik fiyat",
                  active: "border-amber-500 bg-amber-50 ring-1 ring-amber-100",
                  idle: "border-slate-200 bg-white hover:border-amber-200",
                },
              ] as const
            ).map(({ val, label, desc, active, idle }) => (
              <label
                key={val}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition ${
                  islem === val ? active : idle
                }`}
              >
                <input
                  type="radio"
                  name="islem"
                  value={val}
                  checked={islem === val}
                  onChange={() => setIslem(val)}
                  className="mt-0.5 h-4 w-4 accent-sky-600"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{label}</div>
                  <div className="text-xs text-slate-600">{desc}</div>
                </div>
              </label>
            ))}
          </div>

          {islem === "ozel_fiyat" ? (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gecelik özel fiyat (₺)
              </label>
              <input
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                type="number"
                min={0}
                placeholder="Örn. 5200"
                className={PANEL_INPUT_CLASS}
              />
            </div>
          ) : null}

          {displayRange ? (
            <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
              <div className="font-medium text-slate-800">Seçilen tarihler</div>
              <div className="mt-0.5 text-slate-600">
                {formatTurkishDateRange(displayRange.from, displayRange.to)}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleKaydet}
            disabled={!selectedRange?.from || isPending || !selectedListingId}
            className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Kaydediliyor…" : "Tarih aralığını kaydet"}
          </button>

          <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Renk açıklaması
            </div>
            {[
              { renk: "bg-red-100", label: "Dolu" },
              { renk: "bg-amber-100", label: "Özel fiyat" },
              { renk: "bg-sky-100", label: "Onaylı rezervasyon" },
            ].map(({ renk, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-700">
                <div className={`h-4 w-4 rounded border border-slate-200 ${renk}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={PANEL_CARD_CLASS}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Tag className="h-4 w-4 text-sky-600" aria-hidden />
              Sezon fiyatı ekle
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Belirli tarih aralığı için gecelik fiyat tanımlayın. Detaylı liste için{" "}
              <Link href="/panel/fiyat" className="font-medium text-sky-600 hover:underline">
                Fiyat Yönetimi
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <PanelDateRangeField
            value={seasonRange}
            onChange={setSeasonRange}
            label="Sezon tarihleri"
            id="owner-season-range"
          />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Gecelik fiyat (₺)
            </label>
            <input
              type="number"
              min={0}
              value={seasonPrice}
              onChange={(e) => setSeasonPrice(e.target.value)}
              placeholder="Örn. 4500"
              className={PANEL_INPUT_CLASS}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSeasonPrice}
              disabled={isPending}
              className="h-[42px] w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Sezon fiyatı uygula
            </button>
          </div>
        </div>

        {filteredSeasonPrices.length > 0 ? (
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Başlangıç</th>
                  <th className="px-4 py-3">Bitiş</th>
                  <th className="px-4 py-3">Gecelik</th>
                  <th className="px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredSeasonPrices.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">{row.baslangic_tarihi}</td>
                    <td className="px-4 py-3 text-slate-700">{row.bitis_tarihi}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatCurrency(row.gunluk_fiyat)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeSeasonPrice(row.id)}
                        disabled={isPending}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
            Bu ilan için henüz sezon fiyatı tanımlanmadı.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={PANEL_CARD_CLASS}>
          <h2 className="text-base font-semibold text-slate-900">Mevcut takvim kayıtları</h2>
          <p className="mt-1 text-sm text-slate-500">Dolu ve özel fiyat işaretli günler.</p>
          {filteredAvailability.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
              Kayıt yok.
            </p>
          ) : (
            <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Tarih</th>
                    <th className="px-3 py-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAvailability.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{item.tarih}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {DURUM_LABEL[item.durum] ?? item.durum}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={PANEL_CARD_CLASS}>
          <h2 className="text-base font-semibold text-slate-900">Onaylı rezervasyonlar</h2>
          <p className="mt-1 text-sm text-slate-500">Salt okunur — silinemez.</p>
          {filteredReservations.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
              Onaylı rezervasyon yok.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {filteredReservations.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-sm text-sky-900"
                >
                  {row.giris_tarihi} — {row.cikis_tarihi}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
