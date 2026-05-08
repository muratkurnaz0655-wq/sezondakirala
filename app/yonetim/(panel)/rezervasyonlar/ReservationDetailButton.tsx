"use client";

import { useState, useTransition } from "react";
import { normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";
import { Check, Clipboard, CreditCard, FileText, History, Phone, Receipt, ShieldCheck, UserRound } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { saveReservationAdminNote, updateReservationStatus } from "./actions";

type Reservation = Record<string, unknown>;

const HIDDEN_KEYS = new Set(["ilanlar", "paketler"]);

const LABELS: Record<string, string> = {
  id: "Rezervasyon ID",
  kullanici_id: "Kullanıcı ID",
  ilan_id: "İlan ID",
  paket_id: "Paket ID",
  giris_tarihi: "Giriş Tarihi",
  cikis_tarihi: "Çıkış Tarihi",
  misafir_sayisi: "Misafir Sayısı",
  toplam_fiyat: "Toplam Tutar",
  durum: "Durum",
  odeme_yontemi: "Ödeme Yöntemi",
  odeme_durumu: "Ödeme Durumu",
  admin_notu: "Admin Notu",
  referans_no: "Referans No",
  olusturulma_tarihi: "Oluşturulma",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR");
}

function formatValue(key: string, value: unknown) {
  if (value == null || value === "") return "-";
  if (key === "toplam_fiyat" && typeof value === "number") return `₺${value.toLocaleString("tr-TR")}`;
  if (key === "misafir_sayisi" && typeof value === "number") return `${value} kişi`;
  if (key === "odeme_yontemi") {
    if (value === "kart" || value === "credit_card" || value === "kredi_karti") return "Kart";
    if (value === "havale" || value === "bank_transfer" || value === "havale_eft") return "Havale / EFT";
  }
  if (key.endsWith("_tarihi") || key === "olusturulma_tarihi") return formatDate(String(value));
  return String(value);
}

export function ReservationDetailButton({ reservation }: { reservation: Reservation }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ozet" | "teknik">("ozet");
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(String(reservation.admin_notu ?? ""));
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isPending, startTransition] = useTransition();
  const entries = Object.entries(reservation).filter(([k]) => !HIDDEN_KEYS.has(k));
  const normalizedStatus = normalizeReservationStatus(String(reservation.durum ?? "pending"));
  const statusStyle = STATUS_MAP[normalizedStatus];
  const technicalPayload = JSON.stringify(
    Object.fromEntries(entries.map(([key, value]) => [key, value ?? null])),
    null,
    2,
  );

  async function copyTechnicalData() {
    try {
      await navigator.clipboard.writeText(technicalPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function saveNote() {
    setError(null);
    startTransition(async () => {
      const result = await saveReservationAdminNote(String(reservation.id), note);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNotice("Not kaydedildi.");
    });
  }

  function cancelReservation() {
    setError(null);
    startTransition(async () => {
      const result = await updateReservationStatus(String(reservation.id), "cancelled");
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNotice("Rezervasyon iptal edildi.");
      setConfirmCancel(false);
    });
  }

  return (
    <>
      <AdminActionButton
        title="Rezervasyon detaylarini goruntule"
        onClick={() => {
          setActiveTab("ozet");
          setOpen(true);
        }}
        variant="primary"
      >
        Detay
      </AdminActionButton>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 backdrop-blur-[1px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="relative flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 py-4 sm:py-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.25),_transparent_45%)]" />
              <div>
                <h2 className="relative text-sm sm:text-base font-semibold text-white">Rezervasyon Detayı</h2>
                <p className="relative mt-0.5 max-w-[220px] truncate text-xs text-slate-300 sm:max-w-none">
                  {String(reservation.referans_no ?? "Referans bulunamadı")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="relative rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/20 hover:shadow-md active:scale-[0.98]"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-5 bg-slate-50/50 p-4 sm:p-6">
              <div className="flex w-full flex-col gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => setActiveTab("ozet")}
                  className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:w-auto ${
                    activeTab === "ozet"
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  Özet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("teknik")}
                  className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:w-auto ${
                    activeTab === "teknik"
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  Teknik / Ham Veri
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Durum</p>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle.color} ${statusStyle.bg}`}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Toplam Tutar</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatValue("toplam_fiyat", reservation.toplam_fiyat)}
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ödeme</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatValue("odeme_yontemi", reservation.odeme_yontemi)}
                  </p>
                </div>
              </div>

              {activeTab === "ozet" ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <Receipt className="h-3.5 w-3.5 text-sky-500" />
                      Konaklama
                    </p>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Giriş:</span>{" "}
                        {formatValue("giris_tarihi", reservation.giris_tarihi)}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Çıkış:</span>{" "}
                        {formatValue("cikis_tarihi", reservation.cikis_tarihi)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <UserRound className="h-3.5 w-3.5 text-violet-500" />
                      Kimlik ve Misafir
                    </p>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Kullanıcı:</span>{" "}
                        {formatValue("kullanici_adi", reservation.kullanici_adi ?? reservation.kullanici_id)}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">E-posta:</span>{" "}
                        {formatValue("kullanici_email", reservation.kullanici_email)}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Telefon:</span>{" "}
                        {formatValue("kullanici_telefon", reservation.kullanici_telefon)}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Misafir:</span>{" "}
                        {formatValue("misafir_sayisi", reservation.misafir_sayisi)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      İlan / Paket
                    </p>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">İlan ID:</span>{" "}
                        {formatValue("ilan_baslik", reservation.ilan_baslik ?? reservation.ilan_id)}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Paket ID:</span>{" "}
                        {formatValue("paket_id", reservation.paket_id)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <CreditCard className="h-3.5 w-3.5 text-amber-500" />
                      Kayıt Bilgisi
                    </p>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Referans:</span>{" "}
                        {formatValue("referans_no", reservation.referans_no)}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Oluşturulma:</span>{" "}
                        {formatValue("olusturulma_tarihi", reservation.olusturulma_tarihi)}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-900">Ödeme durumu:</span>{" "}
                        {formatValue("odeme_durumu", reservation.odeme_durumu ?? "beklemede")}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <Phone className="h-3.5 w-3.5 text-sky-500" />
                      Misafir İletişim Bilgileri
                    </p>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <p><span className="font-medium text-slate-900">E-posta:</span> {formatValue("kullanici_email", reservation.kullanici_email)}</p>
                      <p><span className="font-medium text-slate-900">Telefon:</span> {formatValue("kullanici_telefon", reservation.kullanici_telefon)}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
                    <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <FileText className="h-3.5 w-3.5 text-amber-500" />
                      Admin Notları
                    </p>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
                      placeholder="Rezervasyon için iç not ekleyin..."
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <AdminActionButton type="button" variant="primary" disabled={isPending} onClick={saveNote}>
                        Notu Kaydet
                      </AdminActionButton>
                      <AdminActionButton type="button" variant="danger" disabled={isPending || normalizedStatus === "cancelled"} onClick={() => setConfirmCancel(true)}>
                        İptal Et
                      </AdminActionButton>
                      {notice ? <span className="text-xs font-medium text-emerald-600">{notice}</span> : null}
                      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
                    <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <History className="h-3.5 w-3.5 text-violet-500" />
                      Rezervasyon Geçmişi
                    </p>
                    <ol className="space-y-2 text-sm text-slate-700">
                      <li>Oluşturuldu: {formatValue("olusturulma_tarihi", reservation.olusturulma_tarihi)}</li>
                      <li>Güncel durum: {statusStyle.label}</li>
                      {normalizedStatus === "approved" ? <li>Onaylandı: durum alanı onaylandı olarak güncellendi.</li> : null}
                      {normalizedStatus === "cancelled" ? <li>İptal edildi: durum alanı iptal olarak güncellendi.</li> : null}
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teknik Alanlar</p>
                    <button
                      type="button"
                      onClick={copyTechnicalData}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
                        copied
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                      {copied ? "Kopyalandı" : "Veriyi Kopyala"}
                    </button>
                  </div>
                  <div className="max-h-[46vh] overflow-y-auto">
                  <table className="w-full table-fixed text-sm">
                    <tbody>
                      {entries.map(([k, v]) => (
                        <tr key={k} className="border-b border-slate-100 last:border-b-0">
                          <td className="w-[36%] break-words bg-slate-50 px-3 sm:px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            {LABELS[k] ?? k.replaceAll("_", " ")}
                          </td>
                          <td className="break-words px-3 sm:px-4 py-2.5 text-sm font-medium text-slate-800">
                            {formatValue(k, v)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {confirmCancel ? (
        <ConfirmModal
          title="Rezervasyonu iptal etmek istediğinize emin misiniz?"
          message="Bu işlem rezervasyonu iptal durumuna alır ve müsaitlik takvimini günceller."
          confirmText="Evet, İptal Et"
          confirmColor="red"
          pending={isPending}
          onCancel={() => setConfirmCancel(false)}
          onConfirm={cancelReservation}
        />
      ) : null}
    </>
  );
}
