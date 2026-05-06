"use client";

import { useMemo, useState, useTransition } from "react";
import { createAdminPackage } from "@/app/actions/admin";

type ListingItem = {
  id: string;
  baslik: string;
  tip: string;
  imageUrl?: string | null;
};

export function AdminPackageCreateForm({ listings }: { listings: ListingItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverFileName, setCoverFileName] = useState<string>("");
  const [detailCount, setDetailCount] = useState<number>(0);

  const selectedVillaCount = useMemo(
    () => listings.filter((item) => selectedIds.includes(item.id) && item.tip === "villa").length,
    [listings, selectedIds],
  );
  const selectedTekneCount = useMemo(
    () => listings.filter((item) => selectedIds.includes(item.id) && item.tip === "tekne").length,
    [listings, selectedIds],
  );

  const isValidCombo = selectedVillaCount > 0 && selectedTekneCount > 0;

  return (
    <form
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      action={(formData) => {
        selectedIds.forEach((id) => formData.append("ilan_idleri", id));
        startTransition(async () => {
          setMessage(null);
          const result = await createAdminPackage(formData);
          if (!result.success) {
            setMessage(result.error);
            return;
          }
          setMessage("Paket başarıyla oluşturuldu.");
          setSelectedIds([]);
        });
      }}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        {["Paket Bilgisi", "İlan Kombinasyonu", "Kontrol"].map((label, i) => (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
              {i + 1}
            </div>
            <span className="hidden text-sm font-medium text-slate-600 md:block">{label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Başlık</span>
          <input
            name="baslik"
            required
            placeholder="Paket başlığı"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Kategori</span>
          <select
            name="kategori"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          >
            <option value="macera">Macera</option>
            <option value="luks">Lüks</option>
            <option value="romantik">Romantik</option>
            <option value="aile">Aile</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Açıklama</span>
          <textarea
            name="aciklama"
            required
            rows={3}
            placeholder="Paket açıklaması"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Süre (gün)</span>
          <input
            name="sure_gun"
            type="number"
            min={1}
            required
            placeholder="Süre"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Kapasite</span>
          <input
            name="kapasite"
            type="number"
            min={1}
            required
            placeholder="Kapasite"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">Fiyat</span>
          <input
            name="fiyat"
            type="number"
            min={0}
            required
            placeholder="Fiyat"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">İlan seçimi (en az 1 villa + 1 tekne)</p>
          <div className="text-xs text-slate-600">
            Villa: <strong>{selectedVillaCount}</strong> · Tekne: <strong>{selectedTekneCount}</strong>
          </div>
        </div>
        <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-2">
          {listings.map((listing) => {
            const selected = selectedIds.includes(listing.id);
            return (
              <label
                key={listing.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  selected ? "border-sky-300 bg-sky-50 text-sky-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    setSelectedIds((prev) =>
                      e.target.checked ? [...prev, listing.id] : prev.filter((id) => id !== listing.id),
                    );
                  }}
                  className="h-4 w-4 cursor-pointer rounded accent-sky-600"
                />
                <div className="h-8 w-12 overflow-hidden rounded bg-slate-200">
                  {listing.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate">{listing.baslik}</p>
                  <p className="text-xs capitalize text-slate-500">{listing.tip}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
            Kapak Fotoğrafı (tek)
          </span>
          <input
            name="cover_file"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFileName(e.currentTarget.files?.[0]?.name ?? "")}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          />
          {coverFileName ? <p className="mt-1 text-xs text-slate-500">{coverFileName}</p> : null}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-500">
            Detay Fotoğrafları (çoklu)
          </span>
          <input
            name="detay_files"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setDetailCount(e.currentTarget.files?.length ?? 0)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          />
          {detailCount > 0 ? <p className="mt-1 text-xs text-slate-500">{detailCount} dosya seçildi</p> : null}
        </label>
      </div>

      {!isValidCombo ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Paket oluşturmak için en az 1 villa ve 1 tekne seçmelisin.
        </p>
      ) : null}

      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.includes("başarı") || message.includes("basari")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !isValidCombo || selectedIds.length < 2}
        className="flex w-full items-center justify-center rounded-xl bg-sky-500 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Oluşturuluyor..." : "Paketi Oluştur"}
      </button>
    </form>
  );
}
