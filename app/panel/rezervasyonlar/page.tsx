import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, ChevronRight, MapPin, Users } from "lucide-react";
import { DEFAULT_STATUS_STYLE, normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";
import { createClient } from "@/lib/supabase/server";

type MedyaRow = { url: string | null; sira: number | null };

function kapakUrl(medyalar: MedyaRow[] | null | undefined): string {
  const sorted = [...(medyalar ?? [])].sort(
    (a, b) => (a.sira ?? 0) - (b.sira ?? 0),
  );
  return sorted[0]?.url ?? "/images/villa-placeholder.svg";
}

function DurumBadge({ durum }: { durum: string }) {
  const normalized = normalizeReservationStatus(durum);
  const s = STATUS_MAP[normalized] ?? {
    ...DEFAULT_STATUS_STYLE,
    label: durum,
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}
    >
      {s.label}
    </span>
  );
}

export default async function PanelReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris?redirect=/panel/rezervasyonlar");
  const userId = user.id;

  const { data: reservations, error: reservationsError } = await supabase
    .from("rezervasyonlar")
    .select("*, ilanlar(baslik, konum, tip, ilan_medyalari(url, sira)), paketler(baslik, gorsel_url)")
    .eq("kullanici_id", user.id)
    .order("olusturulma_tarihi", { ascending: false });
  const reservationsGorunur = reservations ?? [];

  async function cancelReservation(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    const supabaseAction = await createClient();
    await supabaseAction
      .from("rezervasyonlar")
      .update({ durum: "cancelled" })
      .eq("id", id)
      .eq("kullanici_id", userId);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Rezervasyonlarım</h1>
      {reservationsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Rezervasyonlar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
        </div>
      ) : null}
      {reservationsGorunur.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="text-4xl">📅</div>
          <p className="mt-2 text-sm text-slate-700">Rezervasyon bulunamadı.</p>
          <p className="text-xs text-slate-500">Yeni rezervasyonlar burada listelenecek.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reservationsGorunur.map((rez) => {
            const paketRezervasyonu = Boolean(rez.paket_id);
            const kapak = paketRezervasyonu
              ? rez.paketler?.gorsel_url || kapakUrl(rez.ilanlar?.ilan_medyalari)
              : kapakUrl(rez.ilanlar?.ilan_medyalari);
            const baslik = paketRezervasyonu
              ? rez.paketler?.baslik || "Paket rezervasyonu"
              : rez.ilanlar?.baslik || "İlan";
            const konumText = paketRezervasyonu ? "Paket içeriği" : rez.ilanlar?.konum;
            return (
              <div key={rez.id} className="flex gap-3">
                <Link
                  href={`/panel/rezervasyonlar/${rez.id}`}
                  className="group relative min-w-0 flex-1 cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0e9aa7]/20 hover:shadow-md"
                >
                  <div
                    className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl ${
                      normalizeReservationStatus(String(rez.durum)) === "approved"
                        ? "bg-emerald-400"
                        : normalizeReservationStatus(String(rez.durum)) === "pending"
                          ? "bg-amber-400"
                          : normalizeReservationStatus(String(rez.durum)) === "cancelled"
                            ? "bg-red-400"
                            : "bg-slate-300"
                    }`}
                  />
                  <div className="flex gap-4">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      <Image
                        src={kapak}
                        alt={baslik}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-sky-600">
                          {baslik}
                        </h3>
                        <DurumBadge durum={rez.durum} />
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={11} aria-hidden />
                        <span className="truncate">{konumText}</span>
                      </div>
                      {paketRezervasyonu ? (
                        <span className="mt-1 inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                          Paket
                        </span>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} aria-hidden />
                          {format(new Date(rez.giris_tarihi), "d MMM", { locale: tr })}
                          {" → "}
                          {format(new Date(rez.cikis_tarihi), "d MMM yyyy", {
                            locale: tr,
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} aria-hidden />
                          {rez.misafir_sayisi} kişi
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <div>
                      <span className="font-bold text-gray-900">
                        ₺{(rez.toplam_fiyat ?? 0).toLocaleString("tr-TR")}
                      </span>
                      <span className="ml-1 text-xs text-gray-400">toplam</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{rez.referans_no}</span>
                      <ChevronRight
                        size={14}
                        className="text-gray-400 transition-colors group-hover:text-sky-500"
                        aria-hidden
                      />
                    </div>
                  </div>
                </Link>
                {normalizeReservationStatus(String(rez.durum)) === "pending" ? (
                  <form
                    action={cancelReservation}
                    className="flex shrink-0 flex-col justify-center"
                  >
                    <input type="hidden" name="id" value={rez.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:shadow-md active:scale-[0.98]"
                    >
                      İptal Et
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
