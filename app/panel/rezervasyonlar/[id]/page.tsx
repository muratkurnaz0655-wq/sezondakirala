import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { differenceInDays, format } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, MapPin, Users } from "lucide-react";
import { CancelButton } from "./CancelButton";
import { DEFAULT_STATUS_STYLE, normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { getPlatformSettings } from "@/lib/settings";
import { reservationHasJoinedListing } from "@/lib/panel/rezervasyon-ilan-join";
import { createClient } from "@/lib/supabase/server";

type MedyaRow = { url: string | null; sira: number | null };

function kapakUrl(medyalar: MedyaRow[] | null | undefined): string {
  const sorted = [...(medyalar ?? [])].sort(
    (a, b) => (a.sira ?? 0) - (b.sira ?? 0),
  );
  return sorted[0]?.url ?? "/images/villa-placeholder.svg";
}

export default async function PanelRezervasyonDetay({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris?redirect=/panel/rezervasyonlar");

  const { data: rez, error } = await supabase
    .from("rezervasyonlar")
    .select(
      `
      *,
      paketler (
        id, slug, baslik, gorsel_url, sure_gun
      ),
      ilanlar (
        id, slug, baslik, konum, tip, gunluk_fiyat,
        ilan_medyalari (url, sira)
      )
    `,
    )
    .eq("id", id)
    .eq("kullanici_id", user.id)
    .single();

  if (error || !rez) notFound();

  const settings = await getPlatformSettings();
  const geceSayisi = differenceInDays(
    new Date(rez.cikis_tarihi),
    new Date(rez.giris_tarihi),
  );
  const paketRezervasyonu = Boolean(rez.paket_id);
  const normalizedStatus = normalizeReservationStatus(String(rez.durum));
  const durumRenk = STATUS_MAP[normalizedStatus] ?? {
    ...DEFAULT_STATUS_STYLE,
    label: rez.durum,
  };

  const ilanVar = !paketRezervasyonu && reservationHasJoinedListing(rez);
  const gunluk = rez.ilanlar?.gunluk_fiyat ?? 0;
  const kapak = paketRezervasyonu
    ? (rez.paketler?.gorsel_url ?? kapakUrl(rez.ilanlar?.ilan_medyalari))
    : (ilanVar ? kapakUrl(rez.ilanlar?.ilan_medyalari) : "/images/villa-placeholder.svg");
  const ustBaslik = paketRezervasyonu
    ? (rez.paketler?.baslik ?? "Paket rezervasyonu")
    : (ilanVar ? (rez.ilanlar?.baslik ?? "İlan") : "İlan artık yayında değil");
  const listingSlugOrId = rez.ilanlar?.slug || rez.ilanlar?.id || rez.ilan_id;
  const listingHref =
    rez.ilanlar?.tip === "tekne" ? `/tekneler/${listingSlugOrId}` : `/konaklama/${listingSlugOrId}`;
  const sourceHref = paketRezervasyonu
    ? (rez.paketler?.slug || rez.paketler?.id || rez.paket_id
      ? `/paketler/${rez.paketler?.slug || rez.paketler?.id || rez.paket_id}`
      : null)
    : (ilanVar ? listingHref : null);
  const sourceLabel = paketRezervasyonu ? "Paketi Görüntüle" : "İlanı Görüntüle";

  const waText = `Merhaba, ${rez.referans_no} referans numaralı rezervasyonum hakkında bilgi almak istiyorum.`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/panel/rezervasyonlar"
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft size={16} aria-hidden />
        Rezervasyonlarıma Dön
      </Link>

      <div
        className={`mb-6 rounded-2xl border p-4 text-center ${durumRenk.bg} ${durumRenk.color}`}
      >
        <div className={`text-lg font-bold ${durumRenk.color}`}>{durumRenk.label}</div>
        <div className="mt-1 text-sm text-gray-500">
          Referans:{" "}
          <span className="font-mono font-semibold text-gray-700">{rez.referans_no}</span>
        </div>
        {normalizedStatus === "pending" ? (
          <CancelButton reservationId={rez.id} />
        ) : null}
      </div>

      {!paketRezervasyonu && !ilanVar ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Bu rezervasyona ait ilan kaldırılmış veya artık erişilebilir değil. Tarih ve tutar bilgileri aşağıda
          özetlenmiştir.
        </div>
      ) : null}

      <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="relative h-48">
          <Image
            src={kapak}
            alt={ilanVar ? (rez.ilanlar?.baslik ?? "İlan") : "İlan artık yayında değil"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 42rem"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <div className="text-lg font-bold">
              {ustBaslik}
            </div>
            <div className="flex items-center gap-1 text-sm text-white/80">
              <MapPin size={12} aria-hidden />
              {paketRezervasyonu ? "Paket içeriği" : (ilanVar ? rez.ilanlar?.konum : "—")}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="mb-1 text-xs text-gray-400">Giriş</div>
              <div className="text-sm font-bold text-gray-900">
                {format(new Date(rez.giris_tarihi), "d MMM", { locale: tr })}
              </div>
              <div className="text-xs text-gray-400">
                {format(new Date(rez.giris_tarihi), "yyyy")}
              </div>
            </div>
            <div className="rounded-xl bg-sky-50 p-3 text-center">
              <div className="mb-1 text-xs text-sky-500">Süre</div>
              <div className="text-lg font-bold text-sky-700">{geceSayisi}</div>
              <div className="text-xs text-sky-500">gece</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="mb-1 text-xs text-gray-400">Çıkış</div>
              <div className="text-sm font-bold text-gray-900">
                {format(new Date(rez.cikis_tarihi), "d MMM", { locale: tr })}
              </div>
              <div className="text-xs text-gray-400">
                {format(new Date(rez.cikis_tarihi), "yyyy")}
              </div>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-5 text-sm text-gray-600">
            <Users size={16} className="text-gray-400" aria-hidden />
            <span>{rez.misafir_sayisi} misafir</span>
          </div>

          <div className="space-y-2">
            {paketRezervasyonu ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Paket fiyatı ({rez.paketler?.sure_gun ?? geceSayisi} gece)
                </span>
                <span>₺{(rez.toplam_fiyat ?? 0).toLocaleString("tr-TR")}</span>
              </div>
            ) : ilanVar && gunluk > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  ₺{gunluk.toLocaleString("tr-TR")} × {geceSayisi} gece
                </span>
                <span>₺{(gunluk * geceSayisi).toLocaleString("tr-TR")}</span>
              </div>
            ) : null}
            {!paketRezervasyonu && !ilanVar ? (
              <p className="text-xs text-gray-500">
                İlan kaldırıldığı için günlük ücret kırılımı gösterilemiyor; ödediğiniz toplam tutar kayıtlıdır.
              </p>
            ) : null}
            <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold">
              <span>Toplam</span>
              <span className="text-sky-600">
                ₺{(rez.toplam_fiyat ?? 0).toLocaleString("tr-TR")}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 text-sm">
            <span className="text-gray-500">Ödeme Yöntemi</span>
            <span className="font-medium">
              {rez.odeme_yontemi === "kart" ? "💳 Kredi Kartı" : "🏦 Havale"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {sourceHref ? (
          <Link
            href={sourceHref}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 py-3.5 font-semibold text-sky-700 transition-colors hover:bg-sky-100"
          >
            {sourceLabel}
          </Link>
        ) : null}
        <a
          href={waHref}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-3.5 font-semibold text-white transition-colors hover:bg-green-600"
        >
          💬 WhatsApp ile İletişime Geç
        </a>
      </div>

      <div className="mt-4 text-center text-xs text-gray-400">
        TURSAB Üyesidir — Belge No: {settings.tursabNo}
      </div>
    </div>
  );
}
