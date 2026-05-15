"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import { tr } from "date-fns/locale";
import {
  createSeasonPriceByAdmin,
  deleteSeasonPriceByAdmin,
  setAvailabilityRangeByAdmin,
} from "@/app/actions/admin";
import { formatCurrency } from "@/lib/utils/format";
import { dateFromYmdLocal } from "@/lib/tr-today";

type AvailabilityRow = {
  id: string;
  tarih: string;
  durum: "musait" | "dolu" | "ozel_fiyat";
  fiyat_override?: number | null;
};

type SeasonPriceRow = {
  id: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  gunluk_fiyat: number;
};

type ReservationRow = {
  id: string;
  giris_tarihi: string;
  cikis_tarihi: string;
  durum?: string;
};

type AdminListingCalendarManagerProps = {
  ilanId: string;
  sezonFiyatlari: SeasonPriceRow[];
  musaitlik: AvailabilityRow[];
  rezervasyonlar: ReservationRow[];
  /** Koyu admin paneli */
  variant?: "default" | "admin";
};

function toDate(value: string) {
  return dateFromYmdLocal(value);
}

function dateToIso(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

export function AdminListingCalendarManager({
  ilanId,
  sezonFiyatlari,
  musaitlik,
  rezervasyonlar,
  variant = "default",
}: AdminListingCalendarManagerProps) {
  const router = useRouter();
  const admin = variant === "admin";
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [overridePrice, setOverridePrice] = useState<string>("");
  const [islem, setIslem] = useState<"dolu" | "musait" | "ozel_fiyat">("dolu");
  const [seasonStart, setSeasonStart] = useState<string>("");
  const [seasonEnd, setSeasonEnd] = useState<string>("");
  const [seasonPrice, setSeasonPrice] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { doluDays, ozelFiyatDays, onayliRezervasyonDays } = useMemo(() => {
    const dolu = musaitlik
      .filter((item) => item.durum === "dolu")
      .map((item) => toDate(item.tarih));
    const ozel = musaitlik
      .filter((item) => item.durum === "ozel_fiyat")
      .map((item) => toDate(item.tarih));
    const rezervasyon = rezervasyonlar.flatMap((item) => {
      const end = toDate(item.cikis_tarihi);
      end.setDate(end.getDate() - 1);
      if (end < toDate(item.giris_tarihi)) return [];
      return createRangeDates(item.giris_tarihi, dateToIso(end));
    });
    return {
      doluDays: dolu,
      ozelFiyatDays: ozel,
      onayliRezervasyonDays: rezervasyon,
    };
  }, [musaitlik, rezervasyonlar]);

  function getRange() {
    if (!selectedRange?.from) return null;
    let from = dateToIso(selectedRange.from);
    let to = dateToIso(selectedRange.to ?? selectedRange.from);
    if (from > to) {
      const t = from;
      from = to;
      to = t;
    }
    return { from, to };
  }

  function handleKaydet() {
    const range = getRange();
    if (!range) {
      setMessage("Önce takvimden bir tarih veya aralık seçin.");
      return;
    }

    if (islem === "ozel_fiyat" && !overridePrice.trim()) {
      setMessage("Özel fiyat için tutar girin.");
      return;
    }

    startTransition(async () => {
      const result = await setAvailabilityRangeByAdmin({
        ilanId,
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

  function createSeasonPrice() {
    if (!seasonStart || !seasonEnd || !seasonPrice) {
      setMessage("Sezon fiyatı için tüm alanları doldurun.");
      return;
    }

    startTransition(async () => {
      const result = await createSeasonPriceByAdmin({
        ilanId,
        baslangicTarihi: seasonStart,
        bitisTarihi: seasonEnd,
        gunlukFiyat: Number(seasonPrice),
      });
      setMessage(
        result.success ? "Sezon fiyatı kaydedildi." : (result.error ?? "Sezon fiyatı kaydedilemedi."),
      );
      if (result.success) router.refresh();
    });
  }

  function removeSeasonPrice(id: string) {
    startTransition(async () => {
      const result = await deleteSeasonPriceByAdmin(id, ilanId);
      setMessage(
        result.success ? "Sezon fiyatı silindi." : (result.error ?? "Sezon fiyatı silinemedi."),
      );
      if (result.success) router.refresh();
    });
  }

  const range = selectedRange?.from
    ? { from: selectedRange.from, to: selectedRange.to ?? selectedRange.from }
    : null;

  const cardShell = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
  const titleClass = "text-slate-900";
  const subText = "text-slate-500";
  const bodyText = "text-slate-700";
  const dayModClasses = admin
    ? {
        dolu: "rounded-md bg-red-100 font-semibold text-red-800",
        ozel: "rounded-md bg-amber-100 font-semibold text-amber-800",
        rezervasyon: "rounded-md bg-emerald-100 font-semibold text-emerald-800",
      }
    : {
        dolu: "rounded-md bg-red-100 font-medium text-red-900",
        ozel: "rounded-md bg-amber-100 font-medium text-amber-900",
        rezervasyon: "rounded-md bg-sky-100 font-medium text-sky-900",
      };

  const strongInputClass =
    "h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className={`text-xl font-bold ${titleClass}`}>Takvim Yönetimi</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div
          className={`${cardShell} [&_.rdp-caption_label]:text-base [&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-slate-900 [&_.rdp-day_button]:h-9 [&_.rdp-day_button]:w-9 [&_.rdp-day_button]:rounded-md [&_.rdp-day_button]:text-sm [&_.rdp-day_button]:font-medium [&_.rdp-day_button]:text-slate-800 [&_.rdp-day_button:hover]:bg-slate-100 [&_.rdp-months]:gap-6 [&_.rdp-nav_button]:text-slate-700 [&_.rdp-nav_button]:hover:bg-slate-100 [&_.rdp-weekday]:text-xs [&_.rdp-weekday]:font-semibold [&_.rdp-weekday]:text-slate-500`}
        >
          <DayPicker
            mode="range"
            locale={tr}
            numberOfMonths={2}
            selected={selectedRange}
            onSelect={setSelectedRange}
            modifiers={{
              dolu: doluDays,
              ozel: ozelFiyatDays,
              rezervasyon: onayliRezervasyonDays,
            }}
            modifiersClassNames={{
              dolu: dayModClasses.dolu,
              ozel: dayModClasses.ozel,
              rezervasyon: dayModClasses.rezervasyon,
            }}
          />
        </div>

        <div className={cardShell}>
          <h3 className={`mb-4 font-semibold ${titleClass}`}>İşlem Seç</h3>

          <div className="mb-6 space-y-3">
            {(
              [
                {
                  val: "dolu" as const,
                  label: "Dolu İşaretle",
                  desc: "Bu günler rezervasyona kapalı olur",
                  activeBorder: admin
                    ? "border-red-500 bg-red-100 ring-1 ring-red-200"
                    : "border-red-500 bg-red-50",
                  idleBorder: "border-slate-300 bg-white hover:border-red-300",
                },
                {
                  val: "musait" as const,
                  label: "Müsait Yap",
                  desc: "Dolu işaretini kaldır",
                  activeBorder: admin
                    ? "border-emerald-500 bg-emerald-100 ring-1 ring-emerald-200"
                    : "border-green-500 bg-green-50",
                  idleBorder: "border-slate-300 bg-white hover:border-emerald-300",
                },
                {
                  val: "ozel_fiyat" as const,
                  label: "Özel Fiyat",
                  desc: "Seçilen günlere özel gecelik fiyat",
                  activeBorder: admin
                    ? "border-amber-500 bg-amber-100 ring-1 ring-amber-200"
                    : "border-amber-500 bg-amber-50",
                  idleBorder: "border-slate-300 bg-white hover:border-amber-300",
                },
              ] as const
            ).map(({ val, label, desc, activeBorder, idleBorder }) => (
              <label
                key={val}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all ${
                  islem === val ? activeBorder : idleBorder
                }`}
              >
                <input
                  type="radio"
                  name="islem"
                  value={val}
                  checked={islem === val}
                  onChange={() => setIslem(val)}
                  className="mt-1 h-4 w-4 accent-sky-600"
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
              <label className={`mb-1 block text-xs font-semibold uppercase ${subText}`}>
                Gecelik özel fiyat (₺)
              </label>
                <input
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                  type="number"
                  min={0}
                  placeholder="Orn: 5200"
                  className={strongInputClass}
                />
            </div>
          ) : null}

          {range ? (
            <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm">
              <div className="font-medium text-slate-800">Seçilen tarihler</div>
              <div className="mt-1 text-slate-600">
                {range.from.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                {selectedRange?.to && selectedRange.from && selectedRange.to.getTime() !== selectedRange.from.getTime()
                  ? ` — ${range.to.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`
                  : null}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleKaydet}
            disabled={!selectedRange?.from || isPending}
            className={
              "w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </button>

          <div className="mt-6 space-y-2">
            <div className={`mb-2 text-xs font-semibold uppercase ${subText}`}>Renk açıklaması</div>
            {[
              { renk: "bg-red-100", label: "Dolu" },
              { renk: "bg-green-100", label: "Takvimde varsayılan (işaretsiz)" },
              { renk: "bg-amber-100", label: "Özel Fiyat" },
              { renk: "bg-sky-100", label: "Onaylı Rezervasyon" },
            ].map(({ renk, label }) => (
              <div key={label} className={`flex items-center gap-2 text-sm ${bodyText}`}>
                <div className={`h-4 w-4 rounded border border-slate-200 ${renk}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cardShell}>
        <h2 className={`text-lg font-semibold ${titleClass}`}>Sezon Fiyatları</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            type="date"
            value={seasonStart}
            onChange={(event) => setSeasonStart(event.target.value)}
            className={strongInputClass}
          />
          <input
            type="date"
            value={seasonEnd}
            onChange={(event) => setSeasonEnd(event.target.value)}
            className={strongInputClass}
          />
          <input
            type="number"
            value={seasonPrice}
            onChange={(event) => setSeasonPrice(event.target.value)}
            placeholder="Gecelik fiyat"
            className={strongInputClass}
          />
          <button
            type="button"
            onClick={createSeasonPrice}
            className="h-[42px] rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-600"
            disabled={isPending}
          >
            Yeni Sezon Fiyatı Ekle
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Başlangıç</th>
                <th className="py-2">Bitiş</th>
                <th className="py-2">Gecelik Fiyat</th>
                <th className="py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {sezonFiyatlari.map((item) => (
                <tr
                  key={item.id}
                  className={admin ? "border-t border-white/10" : "border-t border-slate-100"}
                >
                  <td className="py-2 text-slate-700">{item.baslangic_tarihi}</td>
                  <td className="py-2 text-slate-700">{item.bitis_tarihi}</td>
                  <td className="py-2 text-slate-800">{formatCurrency(item.gunluk_fiyat)}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeSeasonPrice(item.id)}
                      className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      disabled={isPending}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardShell}>
        <h2 className={`text-lg font-semibold ${titleClass}`}>İlan sahibi / sistem kayıtları</h2>
        <p className={`mt-1 text-sm ${subText}`}>
          Kullanıcı panelinden işaretlenen dolu ve özel fiyat günleri burada listelenir.
        </p>
        {musaitlik.length === 0 ? (
          <p className={`mt-4 text-sm ${bodyText}`}>Henüz müsaitlik kaydı yok.</p>
        ) : (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Tarih</th>
                  <th className="py-2 pr-3">Durum</th>
                  <th className="py-2">Özel fiyat</th>
                </tr>
              </thead>
              <tbody>
                {musaitlik.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-800">{item.tarih}</td>
                    <td className="py-2 pr-3 capitalize text-slate-700">
                      {item.durum === "dolu" ? "Dolu" : item.durum === "ozel_fiyat" ? "Özel fiyat" : item.durum}
                    </td>
                    <td className="py-2 text-slate-600">
                      {item.durum === "ozel_fiyat" && item.fiyat_override
                        ? formatCurrency(item.fiyat_override)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {message ? <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
