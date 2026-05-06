"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  deleteListingMediaByAdmin,
  reorderListingMediaByAdmin,
  updateListing,
} from "./actions";

type Listing = {
  id: string;
  baslik: string;
  aciklama?: string | null;
  gunluk_fiyat: number;
  konum: string;
  ilan_medyalari?: { id: string; url: string; sira: number }[] | null;
};

export function EditListingModal({
  listing,
  onClose,
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const konumParcalari = listing.konum.split("-");
  const ilkParca = konumParcalari[0]?.trim() ?? "";
  const kalanParca = konumParcalari.slice(1).join("-").trim();
  const defaultBolge = konumParcalari.length > 1 ? ilkParca : "";
  const defaultLocation = konumParcalari.length > 1 ? kalanParca : listing.konum;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [mediaPending, startMediaTransition] = useTransition();
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [media, setMedia] = useState([...(listing.ilan_medyalari ?? [])].sort((a, b) => a.sira - b.sira));

  const applyMediaResult = (result: {
    success: boolean;
    error?: string;
    media?: { id: string; url: string; sira: number }[];
  }) => {
    if (!result.success) setMediaError(result.error ?? "İşlem tamamlanamadı.");
    else setMediaError(null);
    const safeMedia = Array.isArray(result.media) ? result.media : [];
    setMedia([...safeMedia].sort((a, b) => a.sira - b.sira));
  };

  useEffect(() => {
    if (!mediaNotice) return;
    const timer = window.setTimeout(() => setMediaNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [mediaNotice]);

  const uploadMedia = () => {
    if (selectedFiles.length === 0) {
      setMediaError("Lütfen önce dosya seçin.");
      fileInputRef.current?.click();
      return;
    }
    const formData = new FormData();
    formData.append("listing_id", listing.id);
    selectedFiles.forEach((file) => formData.append("files", file));

    startMediaTransition(async () => {
      try {
        const res = await fetch("/api/admin/listing-media/upload", {
          method: "POST",
          body: formData,
        });
        const rawText = await res.text();
        let result: {
          success: boolean;
          error?: string;
          media?: { id: string; url: string; sira: number }[];
        };
        try {
          result = JSON.parse(rawText) as {
            success: boolean;
            error?: string;
            media?: { id: string; url: string; sira: number }[];
          };
        } catch {
          result = {
            success: false,
            error: `Sunucu JSON dönmedi (HTTP ${res.status}).`,
          };
        }
        applyMediaResult(result);
        if (result.success && res.ok) {
          setMediaNotice(`${selectedFiles.length} görsel eklendi.`);
          setSelectedFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      } catch (error) {
        setMediaError(error instanceof Error ? error.message : "Bağlantı hatası oluştu.");
      }
    });
  };

  const deleteMedia = (mediaId: string) => {
    const shouldDelete = window.confirm("Bu görseli silmek istediğinize emin misiniz?");
    if (!shouldDelete) return;
    startMediaTransition(async () => {
      const result = await deleteListingMediaByAdmin(listing.id, mediaId);
      applyMediaResult(result);
      if (result.success) setMediaNotice("Görsel silindi.");
    });
  };

  const persistOrder = (orderedIds: string[]) => {
    startMediaTransition(async () => {
      const result = await reorderListingMediaByAdmin(listing.id, orderedIds);
      applyMediaResult(result);
      if (result.success) setMediaNotice("Görsel sırası güncellendi.");
    });
  };

  const moveMedia = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    persistOrder(next.map((item) => item.id));
  };

  const setCoverMedia = (mediaId: string) => {
    setMediaNotice("Kapak görsel güncelleniyor...");
    persistOrder([mediaId, ...media.filter((item) => item.id !== mediaId).map((item) => item.id)]);
  };

  const dropMedia = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const next = [...media];
    const from = next.findIndex((item) => item.id === draggingId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggingId(null);
    persistOrder(next.map((item) => item.id));
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-2 sm:p-4">
      <form
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        action={(formData) => {
          startTransition(async () => {
            await updateListing(listing.id, formData);
            onClose();
          });
        }}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 sm:px-6 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900">İlan Düzenle</h3>
              <p className="mt-1 text-sm text-slate-500">
                Temel bilgileri güncelle, görselleri yönet ve kapak görseli seç.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Kapat
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 sm:px-6 py-5">
          <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Temel Bilgiler</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  İlan Başlığı
                </span>
                <input
                  name="title"
                  defaultValue={listing.baslik}
                  required
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bölge
                </span>
                <input
                  name="bolge"
                  defaultValue={defaultBolge}
                  placeholder="Örn. Ölüdeniz"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Konum Detayı
                </span>
                <input
                  name="location"
                  defaultValue={defaultLocation}
                  required
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Açıklama
                </span>
                <textarea
                  name="description"
                  defaultValue={listing.aciklama ?? ""}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Gecelik Fiyat (TL)
                </span>
                <input
                  name="price"
                  type="number"
                  defaultValue={listing.gunluk_fiyat}
                  required
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-900">Fotoğraflar</h4>
              <span className="text-xs text-slate-500">{media.length} görsel</span>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.currentTarget.files ?? []))}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Dosya Seç
              </button>
              <button
                type="button"
                onClick={uploadMedia}
                disabled={mediaPending}
                className="inline-flex h-9 items-center rounded-lg bg-sky-500 px-4 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Görsel Ekle
              </button>
            </div>
            {selectedFiles.length > 0 ? (
              <p className="mb-2 text-xs text-slate-600">{selectedFiles.length} dosya seçildi</p>
            ) : null}
            {mediaError ? (
              <p className="mb-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{mediaError}</p>
            ) : null}
            {mediaNotice ? (
              <p className="mb-2 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{mediaNotice}</p>
            ) : null}
            {media.length === 0 ? (
              <p className="text-xs text-slate-500">Henüz görsel yok.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-3">
                {media.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable={!mediaPending}
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dropMedia(item.id)}
                    className={`rounded-lg border border-slate-200 p-2 transition ${
                      draggingId === item.id ? "opacity-60" : "opacity-100"
                    } ${idx === 0 ? "ring-1 ring-sky-400" : ""}`}
                    style={{ cursor: mediaPending ? "not-allowed" : "grab" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={`Görsel ${idx + 1}`} className="h-24 w-full rounded-md object-cover" />
                    <div className="mt-2">
                      {idx === 0 ? (
                        <span className="inline-block rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                          Kapak Görsel
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCoverMedia(item.id)}
                          disabled={mediaPending}
                          className="h-6 rounded-md border border-sky-200 bg-sky-50 px-2 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                        >
                          Kapak Yap
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveMedia(idx, -1)}
                        disabled={idx === 0 || mediaPending}
                        className="h-7 flex-1 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMedia(idx, 1)}
                        disabled={idx === media.length - 1 || mediaPending}
                        className="h-7 flex-1 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMedia(item.id)}
                        disabled={mediaPending}
                        className="h-7 flex-1 rounded-md border border-red-200 bg-red-50 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 sm:px-6 py-4">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
