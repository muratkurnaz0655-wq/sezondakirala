"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Send, Star } from "lucide-react";
import { submitListingReview } from "@/app/actions/listing-review";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";

const STAR_FILL = "#EF9F27";
const STAR_EMPTY = "#E5E7EB";
const SUBMIT_GREEN = "#1D9E75";

export type ListingCommentRow = {
  id: string;
  kullanici_id: string;
  ilan_id?: string;
  puan: number;
  yorum: string;
  olusturulma_tarihi: string;
  kullanicilar?:
    | { ad_soyad: string | null; avatar_url: string | null; email: string | null }
    | { ad_soyad: string | null; avatar_url: string | null; email: string | null }[]
    | null;
};

function kullaniciFromRow(row: ListingCommentRow) {
  const rel = row.kullanicilar;
  return Array.isArray(rel) ? rel[0] : rel;
}

/** Gösterim adı: ad_soyad doluysa onu; değilse e-postanın @ öncesi; yoksa nötr etiket. */
function displayNameFromCommentRow(row: ListingCommentRow): string {
  const k = kullaniciFromRow(row);
  const rawAd = k?.ad_soyad?.trim();
  if (rawAd) return fixTurkishDisplay(rawAd);
  const em = k?.email?.trim();
  if (em) {
    const local = em.split("@")[0]?.trim();
    if (local) return local;
  }
  return "Misafir";
}

/** Avatar harfleri: önce ad_soyad (ör. Muratcan Kurnaz → MK); yoksa e-posta @ öncesi. */
function initialsFromCommentRow(row: ListingCommentRow): string {
  const k = kullaniciFromRow(row);
  const rawAd = k?.ad_soyad?.trim();
  if (rawAd) {
    const parts = rawAd.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toLocaleUpperCase("tr-TR");
    }
    if (parts.length === 1) {
      const p = parts[0]!;
      if (p.length >= 2) return (p.charAt(0) + p.charAt(1)).toLocaleUpperCase("tr-TR");
      return p.charAt(0).toLocaleUpperCase("tr-TR");
    }
  }
  const em = k?.email?.trim();
  if (em) {
    const local = em.split("@")[0]?.trim() ?? "";
    if (local.length >= 2) return (local.charAt(0) + local.charAt(1)).toLocaleUpperCase("tr-TR");
    if (local.length === 1) return local.toLocaleUpperCase("tr-TR");
  }
  return "?";
}

const AVATAR_BG = [
  "bg-blue-600 text-white",
  "bg-emerald-600 text-white",
  "bg-orange-500 text-white",
] as const;

function avatarToneClass(userId: string): (typeof AVATAR_BG)[number] {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_BG[h % AVATAR_BG.length]!;
}

const RATING_LABELS: Record<number, string> = {
  1: "Kötü",
  2: "Ortalama",
  3: "İyi",
  4: "Çok iyi",
  5: "Mükemmel",
};

function RatingStarsDisplay({ value }: { value: number }) {
  const v = Math.min(5, Math.max(0, Math.round(Number(value) || 0)));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= v;
        return (
          <Star
            key={n}
            className="h-4 w-4 shrink-0"
            fill={filled ? STAR_FILL : "none"}
            stroke={filled ? STAR_FILL : STAR_EMPTY}
            strokeWidth={filled ? 0 : 1.5}
            style={{ color: filled ? STAR_FILL : STAR_EMPTY }}
          />
        );
      })}
    </div>
  );
}

function RatingStarsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Puan seçin"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= shown;
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} yıldız`}
              aria-pressed={value === n}
              className="rounded p-0.5 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              onMouseEnter={() => setHover(n)}
              onClick={() => onChange(n)}
            >
              <Star
                className="h-7 w-7"
                style={{
                  color: filled ? STAR_FILL : STAR_EMPTY,
                  fill: filled ? STAR_FILL : "none",
                }}
                stroke={filled ? STAR_FILL : STAR_EMPTY}
                strokeWidth={filled ? 0 : 1.5}
              />
            </button>
          );
        })}
      </div>
      {value >= 1 && value <= 5 ? (
        <span className="text-sm font-medium text-slate-700">{RATING_LABELS[value]}</span>
      ) : null}
    </div>
  );
}

type ListingCommentsSectionProps = {
  ilanId: string;
  listingSlug: string;
  tip: "villa" | "tekne";
  comments: ListingCommentRow[];
  averageScore: number;
  viewer: {
    userId: string | null;
    approvedReservationId: string | null;
    hasExistingReview: boolean;
  };
};

export function ListingCommentsSection({
  ilanId,
  listingSlug,
  tip,
  comments,
  averageScore,
  viewer,
}: ListingCommentsSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginHref = useMemo(
    () => `/giris?redirect=${encodeURIComponent(tip === "villa" ? `/konaklama/${listingSlug}` : `/tekneler/${listingSlug}`)}`,
    [tip, listingSlug],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!viewer.approvedReservationId) return;
    if (rating < 1) {
      setError("Lütfen yıldızlarla bir puan seçin.");
      return;
    }
    startTransition(async () => {
      const res = await submitListingReview({
        ilanId,
        rezervasyonId: viewer.approvedReservationId!,
        puan: rating,
        yorum: text,
        tip,
        slug: listingSlug,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setText("");
      setRating(0);
      router.refresh();
    });
  }

  const summaryPill =
    comments.length > 0 ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
        <Star className="h-4 w-4 shrink-0" fill={STAR_FILL} stroke={STAR_FILL} strokeWidth={0} style={{ color: STAR_FILL }} />
        <span className="font-semibold tabular-nums">{averageScore.toFixed(1)}</span>
        <span className="text-slate-500">· {comments.length} yorum</span>
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">0 yorum</span>
    );

  const composerBlock = (() => {
    if (!viewer.userId) {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          <p>Yorum yapmak için giriş yapın</p>
          <Link
            href={loginHref}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#0e9aa7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c8a96]"
          >
            Giriş yap
          </Link>
        </div>
      );
    }
    if (viewer.hasExistingReview) return null;
    if (!viewer.approvedReservationId) {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Bu ilandan rezervasyon yapanlar yorum yapabilir
        </div>
      );
    }
    return (
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Deneyiminizi paylaşın</h3>
          <p className="mt-1 text-sm text-slate-500">Bu ilandan rezervasyon yaptıysanız yorum ekleyebilirsiniz.</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Puanınız</p>
          <RatingStarsInput value={rating} onChange={setRating} />
        </div>
        <div className="relative">
          <label htmlFor="listing-review-text" className="mb-1.5 block text-sm font-medium text-slate-800">
            Yorumunuz
          </label>
          <textarea
            id="listing-review-text"
            value={text}
            onChange={(ev) => setText(ev.target.value.slice(0, 500))}
            rows={4}
            minLength={20}
            maxLength={500}
            required
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 pr-16 pb-8 text-sm text-slate-800 shadow-sm transition-[box-shadow,border-color] placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/35"
            placeholder="Konaklamanız hakkında düşüncelerinizi paylaşın..."
          />
          <span className="pointer-events-none absolute bottom-2 right-2 text-xs tabular-nums text-slate-400">
            {text.length} / 500
          </span>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[min(100%,20rem)] text-xs leading-snug text-slate-500">
            <span aria-hidden>🔒</span> Yorumunuz onaylandıktan sonra yayınlanır
          </p>
          <button
            type="submit"
            disabled={pending || text.trim().length < 20 || rating < 1}
            style={{ backgroundColor: SUBMIT_GREEN }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4 shrink-0" aria-hidden />
            {pending ? "Gönderiliyor…" : "Yorum Gönder"}
          </button>
        </div>
      </form>
    );
  })();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Yorumlar</h2>
        {summaryPill}
      </div>

      {comments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#0e9aa7]/20 bg-[#f0fdfd] p-6 text-center">
          <Star className="mx-auto mb-3 h-10 w-10 text-[#0e9aa7]/30" />
          <p className="mb-1 font-medium text-slate-500">Henüz yorum yapılmamış</p>
          <p className="text-sm text-slate-400">İlk yorumu siz yazın!</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {comments.map((row) => {
            const displayName = displayNameFromCommentRow(row);
            const initials = initialsFromCommentRow(row);
            const tone = avatarToneClass(row.kullanici_id);
            const d = new Date(row.olusturulma_tarihi);
            const dateStr = Number.isNaN(d.getTime()) ? "" : format(d, "dd.MM.yyyy", { locale: tr });
            return (
              <li
                key={row.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tone}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-slate-900">{displayName}</span>
                      <RatingStarsDisplay value={Number(row.puan ?? 0)} />
                      <span className="text-xs text-slate-400">{dateStr}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {fixTurkishDisplay(row.yorum)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5">{composerBlock}</div>
    </section>
  );
}
