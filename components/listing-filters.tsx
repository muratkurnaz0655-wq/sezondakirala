import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

type ListingFiltersProps = {
  title: string;
  /** "Temizle" linki — tekneler sayfası için `/tekneler` */
  temizleHref?: string;
  /** Villa özel kategorileri (tekne listesinde kapalı) */
  showOzelKategoriler?: boolean;
  /** Mobilde bottom sheet: dış kart ve başlık gizlenir (başlık sheet üstünde) */
  embedPlain?: boolean;
  /** Villa / tekne — tekne modunda villa-only özellikleri gösterilmez */
  filterVariant?: "villa" | "tekne";
  /** Konaklama masaüstü: deniz temalı sticky kart */
  filterPresentation?: "plain" | "ocean";
  /** Ocean başlığında “Temizle (n)” */
  aktifFiltreSayisi?: number;
  /** Tarih alanlarını filtre panelinde göster/gizle */
  showDateFields?: boolean;
  params?: {
    konum?: string;
    minFiyat?: string;
    maxFiyat?: string;
    kapasite?: string;
    yatakOdasi?: string;
    ozellikler?: string[];
    ozel?: string[];
    giris?: string;
    cikis?: string;
    sirala?: string;
    /** Harita görünümü URL parametresini koru */
    goruntu?: string;
    tekneTipi?: string;
  };
  konumSecenekleri?: string[];
};

const KONUMLAR_VILLA = ["Ölüdeniz", "Çalış", "Göcek", "Hisarönü", "Kayaköy", "Fethiye Merkez"];

const KONUMLAR_TEKNE = ["Marina", "Ölüdeniz İskelesi", "Göcek Marina"];

const OZELLIKLER_VILLA: { value: string; label: string }[] = [
  { value: "havuz", label: "Özel havuz" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "klima", label: "Klima" },
  { value: "deniz_manzarasi", label: "Deniz manzarası" },
  { value: "bahce", label: "Bahçe" },
  { value: "bbq", label: "BBQ / mangal" },
  { value: "jakuzi", label: "Jakuzi" },
  { value: "evcil_hayvan", label: "Evcil hayvan" },
];

/** Tekne sayfasında havuz / jakuzi / bahçe vb. villa alanları yok */
const OZELLIKLER_TEKNE: { value: string; label: string }[] = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "klima", label: "Klima" },
  { value: "kabin", label: "Özel kabin" },
  { value: "kaptan_dahil", label: "Kaptan dahil" },
  { value: "generator", label: "Jeneratör" },
];

const OZELLIK_LABEL_MAP: Record<string, string> = Object.fromEntries(
  [...OZELLIKLER_VILLA, ...OZELLIKLER_TEKNE].map((o) => [o.value, o.label]),
);

export function getOzellikLabel(slug: string) {
  return OZELLIK_LABEL_MAP[slug] ?? slug;
}

export const OZEL_KATEGORILER: { slug: string; isim: string }[] = [
  { slug: "korunakli", isim: "Korunaklı / Muhafazakâr villalar" },
  { slug: "isitmali_havuz", isim: "Isıtmalı havuzlu villalar" },
  { slug: "balayi", isim: "Balayı villaları" },
  { slug: "denize_sifir", isim: "Denize sıfır villalar" },
  { slug: "buyuk_kapasite_10", isim: "Büyük kapasite (10+ kişi)" },
];

export function getOzelKategoriLabel(slug: string) {
  return OZEL_KATEGORILER.find((o) => o.slug === slug)?.isim ?? slug;
}

export function ListingFilters({
  title,
  params,
  embedPlain,
  temizleHref = "/konaklama",
  showOzelKategoriler = true,
  filterVariant = "villa",
  filterPresentation = "plain",
  aktifFiltreSayisi = 0,
  showDateFields = true,
  konumSecenekleri,
}: ListingFiltersProps) {
  const selectedFeatures = new Set(params?.ozellikler ?? []);
  const selectedOzel = new Set(params?.ozel ?? []);
  const konumValue = params?.konum ?? "";
  const isTekne = filterVariant === "tekne";
  const konumlar =
    konumSecenekleri && konumSecenekleri.length > 0
      ? konumSecenekleri
      : isTekne
        ? KONUMLAR_TEKNE
        : KONUMLAR_VILLA;
  const ozellikler = isTekne ? OZELLIKLER_TEKNE : OZELLIKLER_VILLA;

  const fields = (
    <>
      {params?.goruntu === "harita" ? <input type="hidden" name="goruntu" value="harita" /> : null}
      <div
        className={
          embedPlain ? "space-y-3" : filterPresentation === "ocean" ? "space-y-5" : "mt-4 space-y-3"
        }
      >
        <label
          className={
            filterPresentation === "ocean"
              ? "mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-700"
              : "mb-1 block text-xs font-medium text-slate-500"
          }
        >
          {filterPresentation === "ocean" ? (
            <>
              <span aria-hidden>📍</span> Bölge
            </>
          ) : isTekne ? (
            "Liman / bölge"
          ) : (
            "Konum"
          )}
        </label>
        <select
          name="konum"
          defaultValue={konumValue}
          className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
            filterPresentation === "ocean"
              ? "rounded-xl border border-sky-200 bg-white focus:border-sky-400 focus:outline-none"
              : "border border-slate-300"
          }`}
        >
          <option value="">{isTekne ? "Tüm limanlar" : "Tüm konumlar"}</option>
          {konumlar.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              className={`mb-1 block text-xs ${filterPresentation === "ocean" ? "font-bold uppercase tracking-wider text-sky-700" : "font-medium text-slate-500"}`}
            >
              Min fiyat (₺)
            </label>
            <input
              defaultValue={params?.minFiyat ?? ""}
              name="minFiyat"
              placeholder="0"
              type="number"
              min={0}
              className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
                filterPresentation === "ocean"
                  ? "rounded-xl border border-sky-200 bg-sky-50/50 focus:border-sky-400 focus:outline-none"
                  : "border border-slate-300"
              }`}
            />
          </div>
          <div>
            <label
              className={`mb-1 block text-xs ${filterPresentation === "ocean" ? "font-bold uppercase tracking-wider text-sky-700" : "font-medium text-slate-500"}`}
            >
              Max fiyat (₺)
            </label>
            <input
              defaultValue={params?.maxFiyat ?? ""}
              name="maxFiyat"
              placeholder="∞"
              type="number"
              min={0}
              className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
                filterPresentation === "ocean"
                  ? "rounded-xl border border-sky-200 bg-sky-50/50 focus:border-sky-400 focus:outline-none"
                  : "border border-slate-300"
              }`}
            />
          </div>
        </div>
        <div>
          <label
            className={`mb-1 block text-xs ${filterPresentation === "ocean" ? "font-bold uppercase tracking-wider text-sky-700" : "font-medium text-slate-500"}`}
          >
            Kapasite (kişi)
          </label>
          <input
            defaultValue={params?.kapasite ?? ""}
            name="kapasite"
            placeholder="Örn. 6"
            type="number"
            min={1}
            className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
              filterPresentation === "ocean"
                ? "rounded-xl border border-sky-200 bg-sky-50/50 focus:border-sky-400 focus:outline-none"
                : "border border-slate-300"
            }`}
          />
        </div>
        {isTekne ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Tekne tipi</label>
            <select
              name="tekneTipi"
              defaultValue={params?.tekneTipi ?? ""}
              className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
                filterPresentation === "ocean"
                  ? "rounded-xl border border-sky-200 bg-white focus:border-sky-400 focus:outline-none"
                  : "border border-slate-300"
              }`}
            >
              <option value="">Tüm tipler</option>
              <option value="gulet">Gulet</option>
              <option value="surat">Sürat teknesi</option>
              <option value="yelkenli">Yelkenli</option>
              <option value="katamaran">Katamaran</option>
            </select>
          </div>
        ) : (
          <div>
            <label
              className={`mb-1 block text-xs ${filterPresentation === "ocean" ? "font-bold uppercase tracking-wider text-sky-700" : "font-medium text-slate-500"}`}
            >
              Yatak odası
            </label>
            <input
              defaultValue={params?.yatakOdasi ?? ""}
              name="yatakOdasi"
              placeholder="Örn. 3"
              type="number"
              min={1}
              className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
                filterPresentation === "ocean"
                  ? "rounded-xl border border-sky-200 bg-sky-50/50 focus:border-sky-400 focus:outline-none"
                  : "border border-slate-300"
              }`}
            />
          </div>
        )}
        {showDateFields ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Giriş</label>
              <input
                name="giris"
                type="date"
                defaultValue={params?.giris ?? ""}
                className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
                  filterPresentation === "ocean"
                    ? "rounded-xl border border-sky-200 bg-sky-50/50 focus:border-sky-400 focus:outline-none"
                    : "border border-slate-300"
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Çıkış</label>
              <input
                name="cikis"
                type="date"
                defaultValue={params?.cikis ?? ""}
                className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
                  filterPresentation === "ocean"
                    ? "rounded-xl border border-sky-200 bg-sky-50/50 focus:border-sky-400 focus:outline-none"
                    : "border border-slate-300"
                }`}
              />
            </div>
          </div>
        ) : null}
        {showOzelKategoriler ? (
          <div className="space-y-2 text-sm text-slate-700">
            <h4 className="text-xs font-semibold text-slate-800">Özel kategoriler</h4>
            {OZEL_KATEGORILER.map((k) => (
              <label key={k.slug} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="ozel"
                  value={k.slug}
                  defaultChecked={selectedOzel.has(k.slug)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">{k.isim}</span>
              </label>
            ))}
          </div>
        ) : null}
        <div className="space-y-2 text-sm text-slate-700">
          <p
            className={`text-xs ${filterPresentation === "ocean" ? "font-bold uppercase tracking-wider text-sky-700" : "font-medium text-slate-500"}`}
          >
            Özellikler
          </p>
          {ozellikler.map((oz) => (
            <label key={oz.value} className="flex items-center gap-2">
              <input
                defaultChecked={selectedFeatures.has(oz.value)}
                type="checkbox"
                name="ozellikler"
                value={oz.value}
                className={filterPresentation === "ocean" ? "accent-sky-500" : undefined}
              />
              {oz.label}
            </label>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Sıralama</label>
          <select
            name="sirala"
            defaultValue={params?.sirala ?? ""}
            className={`min-h-11 w-full rounded-lg px-3 py-2 text-sm ${
              filterPresentation === "ocean"
                ? "rounded-xl border border-sky-200 bg-white focus:border-sky-400 focus:outline-none"
                : "border border-slate-300"
            }`}
          >
            <option value="">Önerilen</option>
            <option value="fiyat_artan">Fiyat (artan)</option>
            <option value="fiyat_azalan">Fiyat (azalan)</option>
            <option value="en_yeni">En yeni</option>
          </select>
        </div>
        <button
          type="submit"
          className="min-h-11 w-full rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Filtrele
        </button>
        <Link
          href={temizleHref}
          className={`block min-h-11 rounded-lg py-2 text-center text-sm font-medium ${
            filterPresentation === "ocean"
              ? "rounded-xl border border-sky-200 text-sky-700 hover:bg-sky-50"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Temizle
        </Link>
      </div>
    </>
  );

  if (embedPlain) {
    return fields;
  }

  if (filterPresentation === "ocean") {
    return (
      <aside className="filter-sidebar sticky top-24 w-full max-w-[280px] shrink-0 overflow-hidden shadow-[0_4px_24px_rgba(14,165,233,0.08)]">
        <div
          className="px-5 py-4"
          style={{ background: "linear-gradient(135deg, #0ea5e9, #06b6d4)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <SlidersHorizontal size={16} aria-hidden />
              {title}
            </div>
            {aktifFiltreSayisi > 0 ? (
              <Link
                href={temizleHref}
                className="shrink-0 text-xs text-sky-200 transition-colors hover:text-white"
              >
                Temizle ({aktifFiltreSayisi})
              </Link>
            ) : null}
          </div>
        </div>
        <div className="p-5">{fields}</div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {fields}
    </aside>
  );
}
