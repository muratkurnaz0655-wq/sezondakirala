"use client";

import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CreditCard,
  HelpCircle,
  Plus,
  RotateCcw,
  Search,
  Shield,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { whatsappHref } from "@/lib/constants";

const BRAND_GREEN = "#0F6E56";

type CategoryKey =
  | "rezervasyon"
  | "odeme"
  | "iptal"
  | "ilan-sahipleri"
  | "guvenlik";

type CategoryFilter = "tumu" | CategoryKey;

const CATEGORY_PILLS: { id: CategoryFilter; label: string }[] = [
  { id: "tumu", label: "Tümü" },
  { id: "rezervasyon", label: "Rezervasyon" },
  { id: "odeme", label: "Ödeme" },
  { id: "iptal", label: "İptal & İade" },
  { id: "ilan-sahipleri", label: "İlan Sahipleri" },
  { id: "guvenlik", label: "Güvenlik" },
];

const FAQ_GROUPS: {
  id: CategoryKey;
  title: string;
  icon: typeof CalendarDays;
  items: { question: string; answer: string }[];
}[] = [
  {
    id: "rezervasyon",
    title: "Rezervasyon",
    icon: CalendarDays,
    items: [
      {
        question: "Rezervasyon nasıl yapılır?",
        answer:
          "Tarih seç, bilgileri doldur, ödemeyi tamamla, ekip onaylar, e-posta gelir",
      },
      {
        question: "Giriş-çıkış saatleri nedir?",
        answer:
          "Giriş 14:00, çıkış 12:00. Erken/geç için özel istek kullan.",
      },
      {
        question: "WhatsApp'tan rezervasyon yapılır mı?",
        answer:
          "Destek amaçlı, resmi rezervasyon platform üzerinden yapılmalı",
      },
      {
        question: "Takvimde dolu günler nasıl belirlenir?",
        answer: "Onaylı rezervasyonlar otomatik dolu görünür",
      },
    ],
  },
  {
    id: "odeme",
    title: "Ödeme",
    icon: CreditCard,
    items: [
      {
        question: "Ödeme yöntemleri nelerdir?",
        answer:
          "Kredi/banka kartı (Visa, Mastercard, Troy) ve Havale/EFT",
      },
      {
        question: "Depozito alınıyor mu?",
        answer: "İlana göre değişir, ilan sayfasında belirtilir",
      },
      {
        question: "Sezon fiyatları nedir?",
        answer:
          "Yoğun sezon (Haz-Eyl) ve düşük sezon fiyatları takvimde görünür",
      },
    ],
  },
  {
    id: "iptal",
    title: "İptal & İade",
    icon: RotateCcw,
    items: [
      {
        question: "İptal politikası nedir?",
        answer:
          "14 gün öncesine kadar iptal, daha geç iptallerde iade olmayabilir",
      },
    ],
  },
  {
    id: "ilan-sahipleri",
    title: "İlan Sahipleri",
    icon: Building2,
    items: [
      {
        question: "Villa sahibi nasıl ilan ekler?",
        answer:
          "Kayıt ol, ilan sahibi rolüyle giriş yap, ilan ekle, ekip onaylar",
      },
      {
        question: "İlanlar nasıl onaylanır?",
        answer: "Ekip inceler, kalite kontrolü yapar, e-posta ile bildirir",
      },
    ],
  },
  {
    id: "guvenlik",
    title: "Güvenlik",
    icon: Shield,
    items: [
      {
        question: "TURSAB güvencesi ne anlama gelir?",
        answer: "Belge No 5141, yasal denetim, güvenceli işlem",
      },
      {
        question: "Sorun yaşarsam ne yapmalıyım?",
        answer: "7/24 WhatsApp veya iletişim formu",
      },
    ],
  },
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesSearch(
  query: string,
  items: { question: string; answer: string }[],
) {
  const q = normalize(query.trim());
  if (!q) return items;
  return items.filter(
    (it) =>
      normalize(it.question).includes(q) || normalize(it.answer).includes(q),
  );
}

function FaqAccordionItem({
  question,
  answer,
  groupId,
  index,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  groupId: string;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (open) {
      setMaxHeight(el.scrollHeight);
    } else {
      setMaxHeight(0);
    }
  }, [open, answer]);

  useEffect(() => {
    if (!open || !innerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (innerRef.current && open) {
        setMaxHeight(innerRef.current.scrollHeight);
      }
    });
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [open]);

  const id = `sss-${groupId}-${index}`;

  return (
    <div
      className={[
        "rounded-[12px] border bg-white transition-[border-color,box-shadow] duration-300",
        open
          ? "border-[#0F6E56] shadow-[0_0_0_1px_rgba(15,110,86,0.2),0_8px_28px_-6px_rgba(15,110,86,0.35)]"
          : "border-slate-200 shadow-sm",
      ].join(" ")}
    >
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left sm:px-5 sm:py-5"
      >
        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-slate-900 sm:text-base">
          {question}
        </span>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-300"
          style={{ backgroundColor: BRAND_GREEN }}
          aria-hidden
        >
          {open ? (
            <X className="h-4 w-4" strokeWidth={2.5} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          )}
        </span>
      </button>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        className="overflow-hidden px-4 motion-reduce:transition-none sm:px-5"
        style={{
          maxHeight: open ? maxHeight : 0,
          transition:
            "max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div ref={innerRef}>
          <p className="border-t border-slate-100 pb-4 pt-3 text-sm leading-relaxed text-slate-600">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SssPageClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("tumu");
  const [mounted, setMounted] = useState(false);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredGroups = useMemo(() => {
    const groups =
      category === "tumu"
        ? FAQ_GROUPS
        : FAQ_GROUPS.filter((g) => g.id === category);

    return groups
      .map((g) => ({
        ...g,
        items: matchesSearch(search, g.items),
      }))
      .filter((g) => g.items.length > 0);
  }, [category, search]);

  const waLink = whatsappHref();

  return (
    <div className="w-full overflow-x-hidden bg-slate-50">
      <header
        className="relative px-4 pb-14 pt-10 sm:pb-16 sm:pt-14"
        style={{ backgroundColor: BRAND_GREEN }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            <HelpCircle className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
            Yardım Merkezi
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.5rem]">
            Sıkça Sorulan Sorular
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/90 sm:text-lg">
            Merak ettiğiniz her şeyi burada bulabilirsiniz.
          </p>

          <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-1 shadow-lg shadow-black/10">
            <label className="flex items-center gap-3 rounded-xl px-3 py-3 sm:px-4">
              <Search
                className="h-5 w-5 shrink-0 text-slate-400"
                aria-hidden
              />
              <span className="sr-only">Soru ara</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Soru ara... (örn: ödeme, iptal, rezervasyon)"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 sm:text-base"
                autoComplete="off"
              />
            </label>
          </div>
        </div>
      </header>

      <div
        className={[
          "mx-auto max-w-3xl px-4 transition-opacity duration-700 ease-out",
          mounted ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <nav
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-6 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:py-8"
          aria-label="Kategori filtreleri"
        >
          {CATEGORY_PILLS.map((pill) => {
            const active = category === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setCategory(pill.id);
                  setOpenItems({});
                }}
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                  active
                    ? "text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                ].join(" ")}
                style={
                  active ? { backgroundColor: BRAND_GREEN } : undefined
                }
              >
                {pill.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-12 pb-16">
          {filteredGroups.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
              Aramanızla eşleşen soru bulunamadı. Farklı bir kelime deneyin veya
              kategoriyi &quot;Tümü&quot; yapın.
            </p>
          ) : (
            filteredGroups.map((group) => {
              const Icon = group.icon;
              return (
                <section
                  key={group.id}
                  aria-labelledby={`heading-${group.id}`}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: BRAND_GREEN }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h2
                      id={`heading-${group.id}`}
                      className="shrink-0 text-lg font-bold text-slate-900"
                    >
                      {group.title}
                    </h2>
                    <div
                      className="h-px min-w-[2rem] flex-1 bg-gradient-to-r from-slate-300 to-transparent"
                      aria-hidden
                    />
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item, index) => {
                      const key = `${group.id}-${index}`;
                      const open = !!openItems[key];
                      return (
                        <FaqAccordionItem
                          key={item.question}
                          question={item.question}
                          answer={item.answer}
                          groupId={group.id}
                          index={index}
                          open={open}
                          onToggle={() =>
                            setOpenItems((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>

      <section
        className="px-4 py-14 sm:py-16"
        style={{ backgroundColor: BRAND_GREEN }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Sorunuzu bulamadınız mı?
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-50"
            >
              WhatsApp
            </a>
            <Link
              href="/iletisim"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-transparent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              İletişim Formu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
