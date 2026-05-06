"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Home,
  Minus,
  Package,
  Plus,
  Sailboat,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createListing, createOwnerPackage } from "@/app/actions/owner";

type NewListingWizardProps = {
  initialStep: number;
};

/** Boş veya geçersiz girişte NaN; temizlik boş bırakılırsa 0 kabul edilir. */
function parsePriceInput(s: string): number {
  const t = s.trim().replace(",", ".");
  if (t === "") return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

type ListingRow = { id: string; baslik: string; tip: string };
type PhotoRow = { file: File; preview: string };

const ADIM_BASLIKLARI = ["Temel Bilgiler", "Fotoğraflar", "Özellikler & Konum", "Fiyat & Kurallar"] as const;

const BOLGELER = ["Ölüdeniz", "Çalış", "Göcek", "Hisarönü", "Kayaköy", "Fethiye Merkez"] as const;

const OZELLIKLER: { key: string; label: string; icon: string }[] = [
  { key: "havuz", label: "Özel Havuz", icon: "🏊" },
  { key: "wifi", label: "WiFi", icon: "📶" },
  { key: "klima", label: "Klima", icon: "❄️" },
  { key: "deniz_manzarasi", label: "Deniz Manzarası", icon: "🌊" },
  { key: "bahce", label: "Bahçe", icon: "🌿" },
  { key: "bbq", label: "BBQ / Mangal", icon: "🔥" },
  { key: "otopark", label: "Otopark", icon: "🚗" },
  { key: "camasir_makinesi", label: "Çamaşır Makinesi", icon: "🧺" },
  { key: "bulasik_makinesi", label: "Bulaşık Makinesi", icon: "🍽️" },
  { key: "smart_tv", label: "Smart TV", icon: "📺" },
  { key: "jenerator", label: "Jeneratör", icon: "⚡" },
  { key: "tekne_iskelesi", label: "Tekne İskelesi", icon: "⚓" },
  { key: "jakuzi", label: "Jakuzi", icon: "🛁" },
  { key: "sauna", label: "Sauna", icon: "🧖" },
  { key: "cocuk_dostu", label: "Çocuk Dostu", icon: "👶" },
  { key: "evcil_hayvan", label: "Evcil Hayvan İzinli", icon: "🐾" },
];

const EV_KURALLARI: { key: string; label: string; icon: string }[] = [
  { key: "sigara_izin", label: "Sigara İzinli", icon: "🚬" },
  { key: "evcil_hayvan_izin", label: "Evcil Hayvan İzinli", icon: "🐾" },
  { key: "parti_izin", label: "Parti / Etkinlik İzinli", icon: "🎉" },
  { key: "bebek_izin", label: "Bebek Kabul", icon: "👶" },
];

function SayiInput({
  label,
  altBaslik,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  altBaslik: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      <div className="mb-3 text-xs text-gray-400">{altBaslik}</div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 transition-colors hover:border-sky-500 hover:text-sky-500 disabled:opacity-40"
        >
          <Minus size={14} />
        </button>
        <span className="text-xl font-bold text-gray-900">{value}</span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 transition-colors hover:border-sky-500 hover:text-sky-500 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function NewListingWizard({ initialStep }: NewListingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(() => Math.max(1, Math.min(4, initialStep)));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const n = Math.max(1, Math.min(4, initialStep));
    setStep(n);
  }, [initialStep]);
  const [message, setMessage] = useState<string | null>(null);

  const [tip, setTip] = useState<"villa" | "tekne" | "paket">("villa");
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [konum, setKonum] = useState("");
  const [kapasite, setKapasite] = useState(2);
  const [yatakOdasi, setYatakOdasi] = useState(1);
  const [banyo, setBanyo] = useState(1);

  const [paketIlanIdleri, setPaketIlanIdleri] = useState<string[]>([]);
  const [paketKategori, setPaketKategori] = useState("macera");
  const [mevcutIlanlar, setMevcutIlanlar] = useState<ListingRow[]>([]);

  const [fotograflar, setFotograflar] = useState<PhotoRow[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [seciliOzellikler, setSeciliOzellikler] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    OZELLIKLER.forEach((o) => {
      init[o.key] = o.key === "wifi";
    });
    return init;
  });

  const [minSure, setMinSure] = useState(1);
  const [gunlukFiyat, setGunlukFiyat] = useState("");
  const [temizlikUcreti, setTemizlikUcreti] = useState("");
  const [girisSaati, setGirisSaati] = useState("14:00");
  const [cikisSaati, setCikisSaati] = useState("11:00");
  const [iptalPolitikasi, setIptalPolitikasi] = useState("orta");
  const [evKurallariMetin, setEvKurallariMetin] = useState("");
  const [evKuralCheckbox, setEvKuralCheckbox] = useState<Record<string, boolean>>({
    sigara_izin: false,
    evcil_hayvan_izin: false,
    parti_izin: false,
    bebek_izin: false,
  });
  const [rulesAccepted, setRulesAccepted] = useState(false);

  useEffect(() => {
    if (tip !== "paket") return;
    let cancelled = false;
    createClient()
      .from("ilanlar")
      .select("id,baslik,tip")
      .order("olusturulma_tarihi", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setMevcutIlanlar((data as ListingRow[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [tip]);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFotograflar((prev) => {
      const next = [...prev];
      for (const file of arr) {
        if (next.length >= 15) break;
        if (file.size > 5 * 1024 * 1024) continue;
        next.push({ file, preview: URL.createObjectURL(file) });
      }
      return next;
    });
  }, []);

  function fotografSil(i: number) {
    setFotograflar((prev) => {
      const row = prev[i];
      if (row) URL.revokeObjectURL(row.preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function goToStep(next: number) {
    const n = Math.max(1, Math.min(4, next));
    setStep(n);
    router.push(`/panel/ilanlarim/yeni?adim=${n}`);
  }

  const listingReady = useMemo(() => {
    if (tip === "paket") {
      const fiyat = parsePriceInput(gunlukFiyat);
      return (
        baslik.trim().length >= 10 &&
        aciklama.trim().length >= 50 &&
        paketIlanIdleri.length >= 2 &&
        Number.isFinite(fiyat) &&
        fiyat >= 100 &&
        rulesAccepted
      );
    }
    const gunluk = parsePriceInput(gunlukFiyat);
    const temizRaw = temizlikUcreti.trim();
    const temiz = temizRaw === "" ? 0 : parsePriceInput(temizlikUcreti);
    const temizOk = Number.isFinite(temiz) && temiz >= 0;
    return (
      baslik.trim().length >= 10 &&
      aciklama.trim().length >= 50 &&
      konum.trim().length > 0 &&
      fotograflar.length >= 3 &&
      fotograflar.length <= 15 &&
      Number.isFinite(gunluk) &&
      gunluk >= 100 &&
      temizOk &&
      rulesAccepted
    );
  }, [
    tip,
    baslik,
    aciklama,
    konum,
    fotograflar.length,
    gunlukFiyat,
    temizlikUcreti,
    paketIlanIdleri.length,
    rulesAccepted,
  ]);

  function submitWizard() {
    setMessage(null);
    if (!listingReady) {
      setMessage("Lütfen tüm zorunlu alanları kontrol edin.");
      return;
    }

    if (tip === "paket") {
      const paketFiyat = parsePriceInput(gunlukFiyat);
      const fd = new FormData();
      fd.set("baslik", baslik.trim());
      fd.set("aciklama", aciklama.trim());
      fd.set("kategori", paketKategori);
      fd.set("sure_gun", String(minSure));
      fd.set("kapasite", String(kapasite));
      fd.set("fiyat", String(Number.isFinite(paketFiyat) ? paketFiyat : 0));
      fd.set("ilan_idleri", JSON.stringify(paketIlanIdleri));
      startTransition(async () => {
        const result = await createOwnerPackage(fd);
        if (result.success) {
          setMessage("Paket talebiniz alındı. Admin onayından sonra yayınlanır.");
          router.push("/panel/ilanlarim");
        } else {
          setMessage(result.error ?? "Paket oluşturulamadı.");
        }
      });
      return;
    }

    const mergedOzellikler = { ...seciliOzellikler, ...evKuralCheckbox };
    const formData = new FormData();
    formData.set("baslik", baslik.trim());
    formData.set("aciklama", aciklama.trim());
    formData.set("tip", tip);
    formData.set("konum", konum);
    formData.set("acik_adres", "");
    formData.set("kapasite", String(kapasite));
    formData.set("yatak_odasi", String(yatakOdasi));
    formData.set("banyo", String(banyo));
    const gunlukNum = parsePriceInput(gunlukFiyat);
    const temizStr = temizlikUcreti.trim();
    const temizNum = temizStr === "" ? 0 : parsePriceInput(temizlikUcreti);
    formData.set("gunluk_fiyat", String(Number.isFinite(gunlukNum) ? gunlukNum : 0));
    formData.set("temizlik_ucreti", String(Number.isFinite(temizNum) && temizNum >= 0 ? temizNum : 0));
    formData.set("depozito", "");
    formData.set("giris_saati", girisSaati);
    formData.set("cikis_saati", cikisSaati);
    formData.set("iptal_politikasi", iptalPolitikasi);
    formData.set("ev_kurallari", evKurallariMetin);
    formData.set("min_kiralama_suresi", String(minSure));
    formData.set("ozellikler", JSON.stringify(mergedOzellikler));
    fotograflar.forEach((row) => formData.append("medya", row.file));

    startTransition(async () => {
      const result = await createListing(formData);
      if (result.success) {
        router.push("/panel/ilanlarim");
      } else {
        setMessage(result.error ?? "İlan oluşturulamadı.");
      }
    });
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        {ADIM_BASLIKLARI.map((adim, i) => (
          <div key={adim} className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-sky-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > i + 1 ? <Check size={16} /> : i + 1}
            </div>
            <span
              className={`hidden text-sm md:block ${step === i + 1 ? "font-semibold text-sky-600" : "text-gray-400"}`}
            >
              {adim}
            </span>
            {i < 3 ? <ChevronRight size={16} className="mx-1 hidden shrink-0 text-gray-300 sm:block" /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setTip("villa")}
              className={`rounded-2xl border-2 p-6 text-center transition-all ${
                tip === "villa" ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Home size={32} className={`mx-auto ${tip === "villa" ? "text-sky-500" : "text-gray-400"}`} />
              <div className="mt-2 font-semibold">Villa</div>
              <div className="mt-1 text-xs text-gray-500">Müstakil tatil evi</div>
            </button>
            <button
              type="button"
              onClick={() => setTip("tekne")}
              className={`rounded-2xl border-2 p-6 text-center transition-all ${
                tip === "tekne" ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Sailboat size={32} className={`mx-auto ${tip === "tekne" ? "text-sky-500" : "text-gray-400"}`} />
              <div className="mt-2 font-semibold">Tekne</div>
              <div className="mt-1 text-xs text-gray-500">Gület, sürat, yelkenli</div>
            </button>
            <button
              type="button"
              onClick={() => setTip("paket")}
              className={`rounded-2xl border-2 p-6 text-center transition-all ${
                tip === "paket" ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Package size={32} className={`mx-auto ${tip === "paket" ? "text-sky-500" : "text-gray-400"}`} />
              <div className="mt-2 font-semibold">Paket</div>
              <div className="mt-1 text-xs text-gray-500">Villa + Tekne kombinasyonu</div>
            </button>
          </div>

          {tip === "paket" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-3 font-semibold text-amber-800">📦 Pakete Dahil Edilecek İlanlar</div>
              <p className="mb-3 text-sm text-amber-700">Mevcut ilanlarınızdan villa ve tekne seçin:</p>
              {mevcutIlanlar.length === 0 ? (
                <p className="text-sm text-amber-800">Önce en az bir villa ve bir tekne ilanı oluşturmalısınız.</p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto">
                  {mevcutIlanlar.map((ilan) => (
                    <li key={ilan.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={paketIlanIdleri.includes(ilan.id)}
                          onChange={(e) => {
                            if (e.target.checked) setPaketIlanIdleri((p) => [...p, ilan.id]);
                            else setPaketIlanIdleri((p) => p.filter((id) => id !== ilan.id));
                          }}
                        />
                        <span>
                          {ilan.baslik} — {ilan.tip === "villa" ? "🏠" : "⛵"}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <label className="mb-1 block text-sm font-medium text-amber-900">Paket Kategorisi</label>
                <select
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm"
                  value={paketKategori}
                  onChange={(e) => setPaketKategori(e.target.value)}
                >
                  <option value="macera">Macera</option>
                  <option value="luks">Lüks</option>
                  <option value="romantik">Romantik</option>
                  <option value="aile">Aile</option>
                </select>
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">İlan Başlığı *</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-500 focus:ring-2"
              placeholder="Örn: Ölüdeniz Manzaralı Lüks Villa"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
            />
            {baslik.length > 0 && baslik.length < 10 ? (
              <span className="mt-1 text-xs text-red-500">En az 10 karakter giriniz</span>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Açıklama * <span className="text-xs font-normal text-gray-400">({aciklama.length}/1000)</span>
            </label>
            <textarea
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-500 focus:ring-2"
              placeholder="İlanınızı detaylı anlatın..."
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
            />
            {aciklama.length > 0 && aciklama.length < 50 ? (
              <span className="mt-1 text-xs text-red-500">En az 50 karakter giriniz</span>
            ) : null}
          </div>

          {tip !== "paket" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bölge *</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={konum}
                onChange={(e) => setKonum(e.target.value)}
              >
                <option value="">Bölge seçin</option>
                {BOLGELER.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SayiInput label="Kapasite" altBaslik="Kişi sayısı" min={1} max={30} value={kapasite} onChange={setKapasite} />
            {tip !== "paket" ? (
              <>
                <SayiInput
                  label="Yatak Odası"
                  altBaslik="Oda sayısı"
                  min={1}
                  max={20}
                  value={yatakOdasi}
                  onChange={setYatakOdasi}
                />
                <SayiInput label="Banyo" altBaslik="Banyo sayısı" min={1} max={10} value={banyo} onChange={setBanyo} />
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 2 && tip !== "paket" ? (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? "border-sky-500 bg-sky-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
          >
            <Upload size={40} className="mx-auto mb-3 text-gray-300" />
            <div className="font-medium text-gray-700">Fotoğrafları sürükleyip bırakın</div>
            <div className="mt-1 text-sm text-gray-400">veya</div>
            <label className="btn-primary mt-3 inline-block cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
              Bilgisayardan Seç
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="mt-3 text-xs text-gray-400">Min 3, max 15 fotoğraf • JPG, PNG • Max 5MB</div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
            {fotograflar.map((foto, i) => (
              <div key={foto.preview} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <Image src={foto.preview} alt="" fill className="object-cover" unoptimized sizes="120px" />
                {i === 0 ? (
                  <div className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900">
                    Kapak
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => fotografSil(i)}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 && tip === "paket" ? (
        <p className="text-sm text-slate-600">
          Paket görselleri seçtiğiniz ilanlardan oluşturulur; bu adım villa/tekne ilanları için geçerlidir. İleri ile
          devam edebilirsiniz.
        </p>
      ) : null}

      {step === 3 && tip !== "paket" ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {OZELLIKLER.map(({ key, label, icon }) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                seciliOzellikler[key] ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={seciliOzellikler[key] ?? false}
                onChange={(e) =>
                  setSeciliOzellikler((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
              />
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-medium text-gray-700">{label}</span>
              {seciliOzellikler[key] ? <Check size={14} className="ml-auto text-sky-500" /> : null}
            </label>
          ))}
        </div>
      ) : null}

      {step === 3 && tip === "paket" ? (
        <p className="text-sm text-slate-600">Paket için özellik seçimi ilan kartlarından gelir. Fiyat ve kurallar için ileri.</p>
      ) : null}

      {step === 4 ? (
        <div className="space-y-6">
          {tip !== "paket" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Gecelik Fiyat (₺) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-400">₺</span>
                    <input
                      type="number"
                      min={100}
                      placeholder="4500"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm"
                      value={gunlukFiyat}
                      onChange={(e) => setGunlukFiyat(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Standart dönem için gecelik fiyat</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Temizlik Ücreti (₺) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-400">₺</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="500"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm"
                      value={temizlikUcreti}
                      onChange={(e) => setTemizlikUcreti(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Rezervasyon başına tek seferlik</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Giriş saati</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    value={girisSaati}
                    onChange={(e) => setGirisSaati(e.target.value)}
                  >
                    {["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Çıkış saati</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    value={cikisSaati}
                    onChange={(e) => setCikisSaati(e.target.value)}
                  >
                    {["08:00", "09:00", "10:00", "11:00", "12:00"].map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">İptal politikası</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={iptalPolitikasi}
                  onChange={(e) => setIptalPolitikasi(e.target.value)}
                >
                  <option value="esnek">Esnek (24 saat)</option>
                  <option value="orta">Orta (7 gün)</option>
                  <option value="kati">Katı (14 gün)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ek ev kuralları (metin)</label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Örn: Ses seviyesi, çöp ayrıştırma..."
                  value={evKurallariMetin}
                  onChange={(e) => setEvKurallariMetin(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Paket toplam fiyat (₺) *</label>
              <div className="relative max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-400">₺</span>
                <input
                  type="number"
                  min={100}
                  placeholder="25000"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm"
                  value={gunlukFiyat}
                  onChange={(e) => setGunlukFiyat(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Paket için toplam fiyat (en az 100 ₺)</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Minimum Kiralama Süresi</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5, 7].map((gun) => (
                <button
                  key={gun}
                  type="button"
                  onClick={() => setMinSure(gun)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${
                    minSure === gun
                      ? "border-sky-500 bg-sky-50 text-sky-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {gun} Gece
                </button>
              ))}
            </div>
          </div>

          {tip !== "paket" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ev kuralları</label>
              <div className="grid grid-cols-2 gap-3">
                {EV_KURALLARI.map(({ key, label, icon }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={evKuralCheckbox[key] ?? false}
                      onChange={(e) =>
                        setEvKuralCheckbox((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    <span>{icon}</span>
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={rulesAccepted} onChange={(e) => setRulesAccepted(e.target.checked)} className="mt-1" />
            <span>Yanlış veya yanıltıcı bilgi vermeyeceğimi ve platform kurallarına uyacağımı kabul ediyorum.</span>
          </label>

          {!listingReady ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {tip === "paket"
                ? "Gönder için: başlık ve açıklama uzunlukları, en az 2 ilan seçimi, toplam fiyat (100 ₺+) ve yukarıdaki onay kutusu tamamlanmalıdır."
                : "Gönder için: 1. adımda başlık (10+ karakter), açıklama (50+), bölge; 2. adımda en az 3 fotoğraf; burada gecelik fiyat (100 ₺+), temizlik (rakam veya boş bırakıp 0), yukarıdaki onay kutusu işaretli olmalıdır."}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => goToStep(step - 1)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Geri
          </button>
        ) : null}
        {step < 4 ? (
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600"
          >
            İleri
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending || !listingReady}
            onClick={submitWizard}
            className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Kaydediliyor..." : tip === "paket" ? "Paketi Gönder" : "İlanı Gönder"}
          </button>
        )}
      </div>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
