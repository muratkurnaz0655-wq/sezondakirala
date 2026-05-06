"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createAdminListing } from "../actions";
import {
  BOLGELER,
  KATEGORILER,
  OZELLIKLER,
  TEKNE_LIMANLARI,
  TEKNE_OZELLIKLERI,
  TEKNE_SURE_SECENEKLERI,
  TEKNE_TIPLERI,
} from "@/lib/villa-sabitleri";

export function AdminNewListingForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tip, setTip] = useState<"villa" | "tekne">("villa");
  const [kapasite, setKapasite] = useState(2);
  const [yatakOdasi, setYatakOdasi] = useState(1);
  const [banyo, setBanyo] = useState(1);
  const [temizlikUcreti, setTemizlikUcreti] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [kategori, setKategori] = useState<(typeof KATEGORILER)[number]["value"]>("luks");
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>({
    wifi: true,
    klima: false,
  });

  const villaFeatures = OZELLIKLER.map((oz) => ({ key: oz.value, label: oz.label }));
  const tekneFeatures = [
    ...TEKNE_TIPLERI.map((item) => ({ key: item.value, label: item.label })),
    ...TEKNE_SURE_SECENEKLERI.map((item) => ({ key: item.value, label: item.label })),
    ...TEKNE_OZELLIKLERI.map((item) => ({ key: item.value, label: item.label })),
  ];
  const featureOptions = tip === "villa" ? villaFeatures : tekneFeatures;

  const previews = useMemo(
    () => selectedFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [selectedFiles],
  );

  return (
    <form
      className="space-y-6 overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm"
      action={(formData) => {
        formData.set("cover_index", String(coverIndex));
        startTransition(async () => {
          setError(null);
          setSuccess(null);
          const result = await createAdminListing(formData);
          if (!result.success) {
            setError(result.error);
            return;
          }
          setSuccess("İlan başarıyla oluşturuldu.");
        });
      }}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        {["Temel Bilgiler", "Fotoğraflar", "Özellikler", "Fiyat"].map((label, i) => (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
              {i + 1}
            </div>
            <span className="hidden text-sm font-medium text-slate-600 md:block">{label}</span>
          </div>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-sky-500 bg-sky-50 p-5 text-center">
          <div className="text-sm font-semibold text-sky-700">{tip === "villa" ? "Villa" : "Tekne"}</div>
          <p className="mt-1 text-xs text-sky-600">Kategori seçimi</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tip
          </span>
          <select
            name="tip"
            value={tip}
            onChange={(e) => setTip(e.target.value as "villa" | "tekne")}
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
          >
            <option value="villa">Villa</option>
            <option value="tekne">Tekne</option>
          </select>
        </label>
      </section>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Başlık
        </span>
        <input
          name="title"
          required
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Bölge
        </span>
        <select
          name="konum"
          required
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        >
          <option value="">Bölge seçin</option>
          {(tip === "tekne" ? TEKNE_LIMANLARI : BOLGELER).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      {tip === "villa" ? (
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tatil Türü *</span>
          <div className="grid grid-cols-2 gap-2">
            {KATEGORILER.map((kat) => (
              <button
                key={kat.value}
                type="button"
                onClick={() => setKategori(kat.value)}
                className={`rounded-xl border p-3 text-left text-sm font-medium transition-all ${
                  kategori === kat.value
                    ? "border-[#0e9aa7] bg-[#0e9aa7]/10 text-[#0e9aa7]"
                    : "border-slate-200 text-slate-600 hover:border-[#0e9aa7]/50"
                }`}
              >
                {kat.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Konum Detayı
        </span>
        <input
          name="location"
          required
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Açıklama
        </span>
        <textarea
          name="description"
          rows={4}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Kapasite
        </span>
        <input
          name="kapasite"
          type="number"
          min={1}
          value={kapasite}
          onChange={(e) => setKapasite(Number(e.target.value) || 1)}
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {tip === "tekne" ? "Kabin Sayısı" : "Yatak Odası"}
        </span>
        <input
          name="yatak_odasi"
          type="number"
          min={1}
          value={yatakOdasi}
          onChange={(e) => setYatakOdasi(Number(e.target.value) || 1)}
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Banyo
        </span>
        <input
          name="banyo"
          type="number"
          min={1}
          value={banyo}
          onChange={(e) => setBanyo(Number(e.target.value) || 1)}
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Gecelik Fiyat
        </span>
        <input
          name="price"
          type="number"
          min={0}
          required
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        />
      </label>
      </div>

      {tip === "villa" ? (
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Temizlik Ücreti
        </span>
        <input
          name="temizlik_ucreti"
          type="number"
          min={0}
          value={temizlikUcreti}
          onChange={(e) => setTemizlikUcreti(Number(e.target.value) || 0)}
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
        />
      </label>
      ) : null}

      <div className="md:col-span-2">
        <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {tip === "tekne" ? "Tekne Özellikleri" : "Villa Özellikleri"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:grid-cols-4">
          {featureOptions.map((feature) => (
            <label
              key={feature.key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                selectedFeatures[feature.key] ? "border-sky-300 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-sky-600"
                checked={Boolean(selectedFeatures[feature.key])}
                onChange={(e) =>
                  setSelectedFeatures((prev) => ({
                    ...prev,
                    [feature.key]: e.target.checked,
                  }))
                }
              />
              <span>{feature.label}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Fotoğraflar
        </span>
        <input
          name="medya"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files ?? []);
            setSelectedFiles(files);
            setCoverIndex(0);
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
        />
      </label>

      {selectedFiles.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Kapak Görseli Seç</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-4">
            {previews.map((item, idx) => (
              <label
                key={`${item.name}-${idx}`}
                className={`cursor-pointer rounded-lg border p-2 ${
                  coverIndex === idx ? "border-sky-400 ring-1 ring-sky-300" : "border-slate-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.name} className="h-24 w-full rounded-md object-cover" />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="radio"
                    name="coverIndexUI"
                    checked={coverIndex === idx}
                    onChange={() => setCoverIndex(idx)}
                    className="h-4 w-4 accent-sky-600"
                  />
                  <span className="text-xs text-slate-700">{coverIndex === idx ? "Kapak" : "Kapak yap"}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <input type="hidden" name="cover_index" value={coverIndex} />
      <input type="hidden" name="kategori" value={kategori} />
      <input
        type="hidden"
        name="ozellikler"
        value={JSON.stringify({
          kategori: tip === "villa" ? kategori : null,
          etiketler: Object.entries(selectedFeatures)
            .filter(([, secili]) => secili)
            .map(([key]) => key),
        })}
      />

      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href="/yonetim/ilanlar"
          className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Vazgeç
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
        >
          {isPending ? "Oluşturuluyor..." : "İlanı Oluştur"}
        </button>
      </div>
    </form>
  );
}
