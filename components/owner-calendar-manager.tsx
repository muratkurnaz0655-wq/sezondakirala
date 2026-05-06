"use client";

import { useEffect, useState } from "react";
import { deleteSeasonPriceByOwner, setAvailabilityRangeByOwner } from "@/app/actions/owner";
import { formatCurrency } from "@/lib/utils/format";

type Listing = { id: string; baslik: string };
type Availability = { id: string; ilan_id: string; tarih: string; durum: string };
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
  /** URL `?ilan=` ile gelen ilan; geçerliyse seçili ilan olarak açılır. */
  defaultListingId?: string;
  availability: Availability[];
  seasonPrices: SeasonPrice[];
  reservations: Reservation[];
};

function resolveInitialListingId(preferred: string | undefined, listings: Listing[]) {
  if (preferred && listings.some((l) => l.id === preferred)) return preferred;
  return listings[0]?.id ?? "";
}

export function OwnerCalendarManager({
  listings,
  defaultListingId,
  availability,
  seasonPrices,
  reservations,
}: Props) {
  const [selectedListingId, setSelectedListingId] = useState(() =>
    resolveInitialListingId(defaultListingId, listings),
  );

  useEffect(() => {
    setSelectedListingId(resolveInitialListingId(defaultListingId, listings));
  }, [defaultListingId, listings]);
  const filteredAvailability = availability.filter((item) => item.ilan_id === selectedListingId);
  const filteredSeasonPrices = seasonPrices.filter((item) => item.ilan_id === selectedListingId);
  const filteredReservations = reservations.filter(
    (item) => item.ilan_id === selectedListingId && item.durum === "onaylandi",
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-sm text-slate-700">İlan Seçimi</label>
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={selectedListingId}
          onChange={(event) => setSelectedListingId(event.target.value)}
        >
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.baslik}
            </option>
          ))}
        </select>
      </div>

      <form action={setAvailabilityRangeByOwner} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input type="hidden" name="ilan_id" value={selectedListingId} />
        <input name="baslangic_tarihi" type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        <input name="bitis_tarihi" type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        <select name="durum" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="dolu">Dolu İşaretle</option>
          <option value="musait">Müsait Yap</option>
          <option value="ozel_fiyat">Özel Fiyat</option>
        </select>
        <input name="fiyat_override" type="number" placeholder="Özel fiyat" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white md:col-span-5" type="submit">
          Tarih Aralığını Kaydet
        </button>
      </form>

      <form action={setAvailabilityRangeByOwner} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input type="hidden" name="ilan_id" value={selectedListingId} />
        <input type="hidden" name="durum" value="ozel_fiyat" />
        <input name="baslangic_tarihi" type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        <input name="bitis_tarihi" type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        <input name="fiyat_override" type="number" placeholder="Gecelik fiyat" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white" type="submit">
          Sezon Fiyatı Uygula
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Mevcut Takvim Kayıtları</h2>
        <div className="grid gap-2">
          {filteredAvailability.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <span>{item.tarih}</span>
              <span>{item.durum}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Sezon Fiyatları</h2>
        <div className="space-y-2">
          {filteredSeasonPrices.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <span>
                {row.baslangic_tarihi} - {row.bitis_tarihi} · {formatCurrency(row.gunluk_fiyat)}
              </span>
              <form action={deleteSeasonPriceByOwner}>
                <input type="hidden" name="id" value={row.id} />
                <button className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600" type="submit">
                  Sil
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Onaylı Rezervasyonlar (Sadece Görüntüleme)</h2>
        <div className="space-y-2">
          {filteredReservations.map((row) => (
            <div key={row.id} className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-800">
              {row.giris_tarihi} - {row.cikis_tarihi}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
