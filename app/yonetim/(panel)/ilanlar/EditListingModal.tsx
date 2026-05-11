"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Star, X } from "lucide-react";
import {
  deleteListingMediaByAdmin,
  reorderListingMediaByAdmin,
  updateListing,
} from "./actions";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

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
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
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
    startMediaTransition(async () => {
      const result = await deleteListingMediaByAdmin(listing.id, mediaId);
      applyMediaResult(result);
      if (result.success) setMediaNotice("Görsel silindi.");
      setMediaToDelete(null);
    });
  };

  const persistOrder = (orderedIds: string[]) => {
    startMediaTransition(async () => {
      const result = await reorderListingMediaByAdmin(listing.id, orderedIds);
      applyMediaResult(result);
      if (result.success) setMediaNotice("Kapak görseli güncellendi.");
    });
  };

  const setCoverMedia = (mediaId: string) => {
    const ordered = [mediaId, ...media.filter((item) => item.id !== mediaId).map((item) => item.id)];
    persistOrder(ordered);
  };

  const mediaCount = media.length;
  const mediaCountLabel = `${mediaCount} görsel`;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-2 sm:p-4">
      <form
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        action={(formData) => {
          startTransition(async () => {
            await updateListing(listing.id, formData);
            onClose();
          });
        }}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">İlan Düzenle</h3>
              <p className="mt-1 text-sm text-slate-500">
                Temel bilgileri güncelleyin; fotoğrafları yönetin ve kapak seçin.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Kapat
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-0 overflow-y-auto px-4 py-5 sm:px-6">
          <section>
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

          <hr className="my-6 border-0 border-t border-slate-200" />

          <section>
            <h4 className="mb-1 text-sm font-semibold text-slate-900">
              Fotoğraflar ({mediaCountLabel})
            </h4>
            <p className="mb-4 text-xs text-slate-500">
              Yıldız ile kapak seçin; kırmızı X ile silin. Yeni görselleri aşağıdan ekleyin.
            </p>

            {media.length === 0 ? (
              <p className="mb-4 text-sm text-slate-500">Henüz görsel yok.</p>
            ) : (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {media.map((item, idx) => {
                  const isCover = idx === 0;
                  return (
                    <div key={item.id} className="relative h-20 w-20 shrink-0 sm:h-20 sm:w-20">
                      <div className="relative h-full w-full overflow-hidden rounded-[8px] border border-slate-200 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={`Görsel ${idx + 1}`}
                          className="h-full w-full object-cover"
                          width={80}
                          height={80}
                        />
                        <div className="absolute inset-x-0 top-0 z-10 flex justify-between px-0.5 pt-0.5">
                          {isCover ? (
                            <span
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-400/95 text-white shadow-sm"
                              title="Kapak görseli"
                            >
                              <Star className="h-4 w-4 fill-current" aria-hidden />
                            </span>
                          ) : (
                            <button
                              type="button"
                              title="Kapak yap"
                              aria-label="Kapak yap"
                              disabled={mediaPending}
                              onClick={() => setCoverMedia(item.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/80 bg-black/35 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/50 disabled:opacity-50"
                            >
                              <Star className="h-4 w-4" strokeWidth={2} aria-hidden />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Görseli sil"
                            aria-label="Görseli sil"
                            disabled={mediaPending}
                            onClick={() => setMediaToDelete(item.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#E24B4A] text-white shadow-sm transition hover:bg-[#c93d3b] disabled:opacity-50"
                          >
                            <X className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
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
                className="inline-flex h-9 items-center rounded-lg bg-slate-800 px-4 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Görsel Ekle
              </button>
            </div>
            {selectedFiles.length > 0 ? (
              <p className="mt-2 text-xs text-slate-600">{selectedFiles.length} dosya seçildi</p>
            ) : null}
            {mediaError ? (
              <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{mediaError}</p>
            ) : null}
            {mediaNotice ? (
              <p className="mt-2 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{mediaNotice}</p>
            ) : null}
          </section>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#1D9E75] text-sm font-semibold text-white shadow-sm transition hover:bg-[#188f6a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </form>
      {mediaToDelete ? (
        <ConfirmModal
          title="Görseli silmek istediğinize emin misiniz?"
          message="Bu işlem geri alınamaz. Görsel kalıcı olarak silinecek."
          confirmText="Evet, Sil"
          confirmColor="red"
          pending={mediaPending}
          onCancel={() => setMediaToDelete(null)}
          onConfirm={() => deleteMedia(mediaToDelete)}
        />
      ) : null}
    </div>
  );
}
