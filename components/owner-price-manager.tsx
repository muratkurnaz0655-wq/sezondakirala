"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { Building2, Trash2 } from "lucide-react";
import { createOwnerSeasonPrice, deleteOwnerSeasonPrice } from "@/app/actions/owner";
import { PanelDateRangeField } from "@/components/panel/panel-date-range-field";
import { PANEL_CARD_CLASS, PANEL_INPUT_CLASS } from "@/components/panel/panel-day-picker-styles";
import { ymdFromLocalDate } from "@/lib/availability-dates";
import { formatCurrency } from "@/lib/utils/format";

type Listing = { id: string; baslik: string };
type SeasonPrice = {
  id: string;
  ilan_id: string;
  baslangic_tarihi: string;
  bitis_tarihi: string;
  gunluk_fiyat: number;
};

type Props = {
  listings: Listing[];
  seasonPrices: SeasonPrice[];
  defaultListingId?: string;
};

function resolveInitialListingId(preferred: string | undefined, listings: Listing[]) {
  if (preferred && listings.some((l) => l.id === preferred)) return preferred;
  return listings[0]?.id ?? "";
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

export function OwnerPriceManager({ listings, seasonPrices, defaultListingId }: Props) {
  const router = useRouter();
  const [selectedListingId, setSelectedListingId] = useState(() =>
    resolveInitialListingId(defaultListingId, listings),
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [gunlukFiyat, setGunlukFiyat] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelectedListingId(resolveInitialListingId(defaultListingId, listings));
  }, [defaultListingId, listings]);

  const listingMap = new Map(listings.map((l) => [l.id, l.baslik]));
  const filteredPrices = seasonPrices.filter((row) =>
    selectedListingId ? row.ilan_id === selectedListingId : true,
  );
  const displayPrices = selectedListingId
    ? filteredPrices
    : seasonPrices;

  function handleSubmit() {
    const range = rangeToYmd(dateRange);
    if (!selectedListingId || !range || !gunlukFiyat.trim()) {
      setMessage("İlan, tarih aralığı ve günlük fiyat zorunludur.");
      return;
    }

    startTransition(async () => {
      const result = await createOwnerSeasonPrice({
        ilanId: selectedListingId,
        baslangicTarihi: range.from,
        bitisTarihi: range.to,
        gunlukFiyat: Number(gunlukFiyat),
      });
      setMessage(
        result.success ? "Sezon fiyatı eklendi." : (result.error ?? "Kayıt eklenemedi."),
      );
      if (result.success) {
        setDateRange(undefined);
        setGunlukFiyat("");
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteOwnerSeasonPrice(id);
      setMessage(
        result.success ? "Sezon fiyatı silindi." : (result.error ?? "Silinemedi."),
      );
      if (result.success) router.refresh();
    });
  }

  if (!listings.length) {
    return (
      <div className={`${PANEL_CARD_CLASS} text-center`}>
        <p className="text-sm font-medium text-slate-800">Henüz ilanınız yok</p>
        <p className="mt-1 text-sm text-slate-600">Fiyat tanımlamak için önce ilan oluşturun.</p>
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
        <h2 className="mb-1 text-base font-semibold text-slate-900">Yeni sezon fiyatı</h2>
        <p className="mb-5 text-sm text-slate-500">
          Seçtiğiniz tarih aralığında geçerli gecelik fiyatı belirleyin. Takvimde dolu günleri{" "}
          <Link href="/panel/takvim" className="font-medium text-sky-600 hover:underline">
            Takvim Yönetimi
          </Link>{" "}
          üzerinden işaretleyebilirsiniz.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Building2 className="h-4 w-4 text-sky-600" aria-hidden />
              İlan
            </label>
            <select
              className={PANEL_INPUT_CLASS}
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
            >
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.baslik}
                </option>
              ))}
            </select>
          </div>

          <PanelDateRangeField
            value={dateRange}
            onChange={setDateRange}
            label="Tarih aralığı"
            id="owner-price-range"
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Günlük fiyat (₺)
            </label>
            <input
              type="number"
              min={0}
              value={gunlukFiyat}
              onChange={(e) => setGunlukFiyat(e.target.value)}
              placeholder="Örn. 3500"
              className={PANEL_INPUT_CLASS}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="h-[42px] w-full rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
              {isPending ? "Ekleniyor…" : "Sezon fiyatı ekle"}
            </button>
          </div>
        </div>
      </div>

      <div className={PANEL_CARD_CLASS}>
        <h2 className="text-base font-semibold text-slate-900">Kayıtlı sezon fiyatları</h2>
        <p className="mt-1 text-sm text-slate-500">
          {selectedListingId
            ? `${listingMap.get(selectedListingId) ?? "İlan"} için tanımlı fiyatlar`
            : "Tüm ilanlarınız"}
        </p>

        {displayPrices.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-800">Henüz sezon fiyatı yok</p>
            <p className="mt-1 text-sm text-slate-600">
              Yukarıdaki formdan tarih aralığı ve günlük fiyat ekleyin.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3 sm:hidden">
              {displayPrices.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {listingMap.get(row.ilan_id) ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.baslangic_tarihi} — {row.bitis_tarihi}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-bold text-[#0e9aa7]">
                      {formatCurrency(row.gunluk_fiyat)}
                      <span className="ml-1 text-xs font-normal text-slate-500">/ gece</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Sil
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 hidden overflow-x-auto rounded-xl border border-slate-100 sm:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">İlan</th>
                    <th className="px-4 py-3">Başlangıç</th>
                    <th className="px-4 py-3">Bitiş</th>
                    <th className="px-4 py-3">Fiyat</th>
                    <th className="px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPrices.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {listingMap.get(row.ilan_id) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.baslangic_tarihi}</td>
                      <td className="px-4 py-3 text-slate-700">{row.bitis_tarihi}</td>
                      <td className="px-4 py-3 font-semibold text-[#0e9aa7]">
                        {formatCurrency(row.gunluk_fiyat)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {message ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
