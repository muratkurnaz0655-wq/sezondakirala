"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  deletePackageMedia,
  reorderPackageDetailMedia,
  setPackageCoverMedia,
  updatePackage,
} from "./actions";
import { AdminActionButton } from "@/components/admin/AdminActionButton";

type ListingItem = {
  id: string;
  baslik: string;
  tip: string;
  imageUrl?: string | null;
};

type PackageRow = {
  id: string;
  baslik: string;
  kategori?: string | null;
  sure_gun?: number | null;
  kapasite?: number | null;
  fiyat: number;
  aciklama?: string | null;
  gorsel_url?: string | null;
  ilan_idleri?: string[] | null;
  paket_medyalari?: { id: string; url: string; tip: string; sira: number }[] | null;
};

export function PackageEditButton({ pkg, listings }: { pkg: PackageRow; listings: ListingItem[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mediaPending, startMediaTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [mediaRows, setMediaRows] = useState((pkg.paket_medyalari ?? []) as NonNullable<PackageRow["paket_medyalari"]>);

  useEffect(() => {
    if (open) setMediaRows((pkg.paket_medyalari ?? []) as NonNullable<PackageRow["paket_medyalari"]>);
  }, [open, pkg.paket_medyalari]);
  useEffect(() => {
    if (!mediaNotice) return;
    const timer = window.setTimeout(() => setMediaNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [mediaNotice]);
  const selectedIds = useMemo(
    () => (Array.isArray(pkg.ilan_idleri) ? pkg.ilan_idleri.map((id) => String(id)) : []),
    [pkg.ilan_idleri],
  );

  const selectedVillaCount = useMemo(
    () => listings.filter((item) => selectedIds.includes(item.id) && item.tip === "villa").length,
    [listings, selectedIds],
  );
  const selectedTekneCount = useMemo(
    () => listings.filter((item) => selectedIds.includes(item.id) && item.tip === "tekne").length,
    [listings, selectedIds],
  );
  const selectedListings = useMemo(
    () => listings.filter((item) => selectedIds.includes(item.id)),
    [listings, selectedIds],
  );
  const detailMedias = useMemo(
    () =>
      (mediaRows ?? [])
        .filter((m) => m.tip === "detay")
        .sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0)),
    [mediaRows],
  );
  const coverMedia = useMemo(() => (mediaRows ?? []).find((m) => m.tip === "kapak"), [mediaRows]);

  const applyMediaResult = (result: {
    success: boolean;
    error?: string;
    media?: { id: string; paket_id: string; url: string; tip: "kapak" | "detay"; sira: number }[];
  }) => {
    if (!result.success) setError(result.error ?? "Medya işlemi başarısız.");
    else setError(null);
    if (Array.isArray(result.media)) {
      setMediaRows(result.media);
    }
  };

  const moveDetailMedia = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= detailMedias.length) return;
    const next = [...detailMedias];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    startMediaTransition(async () => {
      const result = await reorderPackageDetailMedia(
        pkg.id,
        next.map((item) => item.id),
      );
      applyMediaResult(result);
      if (result.success) setMediaNotice("Detay görsel sırası güncellendi.");
    });
  };

  const dropDetailMedia = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const next = [...detailMedias];
    const from = next.findIndex((item) => item.id === draggingId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggingId(null);
    startMediaTransition(async () => {
      const result = await reorderPackageDetailMedia(
        pkg.id,
        next.map((item) => item.id),
      );
      applyMediaResult(result);
      if (result.success) setMediaNotice("Detay görsel sırası güncellendi.");
    });
  };

  return (
    <>
      <AdminActionButton
        onClick={() => setOpen(true)}
        variant="secondary"
      >
        Düzenle
      </AdminActionButton>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            action={(formData) => {
              startTransition(async () => {
                setError(null);
                const result = await updatePackage(pkg.id, formData);
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
              });
            }}
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Paketi Düzenle</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Paket bilgilerini ve villa+tekne kombinasyonunu güncelle.
                  </p>
                </div>
                <AdminActionButton
                  onClick={() => setOpen(false)}
                  variant="secondary"
                  size="md"
                >
                  Kapat
                </AdminActionButton>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                <h4 className="mb-4 text-sm font-semibold text-slate-900">Temel Bilgiler</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Başlık
                    </span>
                    <input
                      name="name"
                      defaultValue={pkg.baslik}
                      required
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kategori
                    </span>
                    <select
                      name="kategori"
                      defaultValue={pkg.kategori ?? "macera"}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    >
                      <option value="macera">Macera</option>
                      <option value="luks">Lüks</option>
                      <option value="romantik">Romantik</option>
                      <option value="aile">Aile</option>
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Açıklama
                    </span>
                    <textarea
                      name="description"
                      rows={4}
                      defaultValue={pkg.aciklama ?? ""}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Süre (gün)
                    </span>
                    <input
                      name="sure_gun"
                      type="number"
                      min={1}
                      defaultValue={pkg.sure_gun ?? 1}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kapasite
                    </span>
                    <input
                      name="kapasite"
                      type="number"
                      min={1}
                      defaultValue={pkg.kapasite ?? 1}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fiyat
                    </span>
                    <input
                      name="price"
                      type="number"
                      min={0}
                      defaultValue={pkg.fiyat}
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Pakete Dahil İçerik (salt okunur)</p>
                  <div className="text-xs text-slate-600">
                    Villa: <strong>{selectedVillaCount}</strong> · Tekne: <strong>{selectedTekneCount}</strong>
                  </div>
                </div>
                <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-2">
                  {selectedListings.map((listing) => {
                    return (
                      <div
                        key={listing.id}
                        className="flex items-center gap-3 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2.5 text-sm text-sky-800"
                      >
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] text-white">
                          ✓
                        </span>
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
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Paket düzenlemede villa/tekne seçimi değiştirilemez. Sadece paket bilgisi ve görseli
                  güncellenir.
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Görseller</h4>
                {coverMedia?.url || pkg.gorsel_url ? (
                  <div className="mb-3 rounded-lg border border-slate-200 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverMedia?.url ?? pkg.gorsel_url ?? ""}
                      alt="Paket görseli"
                      className="h-40 w-full rounded-md object-cover"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                        Aktif Kapak Görseli
                      </span>
                      {coverMedia ? (
                        <button
                          type="button"
                          disabled={mediaPending}
                          onClick={() => {
                            const shouldDelete = window.confirm("Kapak görselini kaldırmak istediğinize emin misiniz?");
                            if (!shouldDelete) return;
                            startMediaTransition(async () => {
                              const result = await deletePackageMedia(pkg.id, coverMedia.id);
                              applyMediaResult(result);
                              if (result.success) setMediaNotice("Kapak görsel kaldırıldı.");
                            });
                          }}
                          className="h-8 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition-all duration-200 hover:bg-red-100 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                          Kapağı Kaldır
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    Henüz paket görseli yok
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Görsel URL
                    </span>
                    <input
                      name="gorsel_url"
                      defaultValue={pkg.gorsel_url ?? ""}
                      placeholder="https://..."
                      className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Bilgisayardan yükle
                    </span>
                    <input
                      name="cover_file"
                      type="file"
                      accept="image/*"
                      className="block h-10 w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Detay Fotoğrafları (çoklu)
                    </span>
                    <input
                      name="detay_files"
                      type="file"
                      accept="image/*"
                      multiple
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </label>
                </div>
                {detailMedias.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mevcut Detay Fotoğrafları
                      </p>
                      <span className="text-[11px] text-slate-500">
                        Sürükle-bırak veya ok tuşlarıyla sıralayabilirsiniz
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {detailMedias.map((media, idx) => (
                        <div
                          key={media.id}
                          draggable={!mediaPending}
                          onDragStart={() => setDraggingId(media.id)}
                          onDragEnd={() => setDraggingId(null)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => dropDetailMedia(media.id)}
                          className={`rounded-md border border-slate-200 p-1.5 transition ${
                            draggingId === media.id ? "opacity-60" : "opacity-100"
                          }`}
                          style={{ cursor: mediaPending ? "not-allowed" : "grab" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={media.url}
                            alt="Detay görseli"
                            className="h-24 w-full rounded object-cover"
                          />
                          <div className="mt-1.5 grid grid-cols-4 gap-1">
                            <button
                              type="button"
                              disabled={mediaPending}
                              onClick={() =>
                                startMediaTransition(async () => {
                                  const result = await setPackageCoverMedia(pkg.id, media.id);
                                  applyMediaResult(result);
                                  if (result.success) setMediaNotice("Kapak görsel güncellendi.");
                                })
                              }
                              className="rounded border border-sky-200 bg-sky-50 px-1 py-1 text-[10px] font-semibold text-sky-700 transition-all duration-200 hover:bg-sky-100 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                            >
                              Kapak
                            </button>
                            <button
                              type="button"
                              disabled={mediaPending || idx === 0}
                              onClick={() => moveDetailMedia(idx, -1)}
                              className="rounded border border-slate-200 bg-white px-1 py-1 text-[10px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={mediaPending || idx === detailMedias.length - 1}
                              onClick={() => moveDetailMedia(idx, 1)}
                              className="rounded border border-slate-200 bg-white px-1 py-1 text-[10px] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              disabled={mediaPending}
                              onClick={() => {
                                const shouldDelete = window.confirm("Bu detay görselini silmek istediğinize emin misiniz?");
                                if (!shouldDelete) return;
                                startMediaTransition(async () => {
                                  const result = await deletePackageMedia(pkg.id, media.id);
                                  applyMediaResult(result);
                                  if (result.success) setMediaNotice("Detay görsel silindi.");
                                });
                              }}
                              className="rounded border border-red-200 bg-red-50 px-1 py-1 text-[10px] font-semibold text-red-700 transition-all duration-200 hover:bg-red-100 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Henüz detay görseli yok. Yukarıdan çoklu dosya seçip Kaydet ile ekleyebilirsiniz.
                  </p>
                )}
              </section>
              {mediaNotice ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{mediaNotice}</p>
              ) : null}
              {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex justify-end gap-2">
              <AdminActionButton
                onClick={() => setOpen(false)}
                variant="secondary"
                size="md"
              >
                Vazgeç
              </AdminActionButton>
              <AdminActionButton
                type="submit"
                disabled={isPending}
                variant="primary"
                size="md"
              >
                Kaydet
              </AdminActionButton>
            </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
