"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitListingReview } from "@/app/actions/listing-review";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";

export type ListingCommentRow = {
  id: string;
  kullanici_id: string;
  puan: number;
  yorum: string;
  olusturulma_tarihi: string;
  kullanicilar?:
    | { ad_soyad: string | null; avatar_url: string | null }
    | { ad_soyad: string | null; avatar_url: string | null }[]
    | null;
};

function profileFromRow(row: ListingCommentRow) {
  const rel = row.kullanicilar;
  const k = Array.isArray(rel) ? rel[0] : rel;
  const raw = k?.ad_soyad?.trim();
  return {
    name: raw ? fixTurkishDisplay(raw) : "Misafir",
    avatarUrl: k?.avatar_url ?? null,
  };
}

function initials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toLocaleUpperCase("tr-TR");
}

function StarRow({ value, interactive, onChange }: { value: number; interactive?: boolean; onChange?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const common = "h-5 w-5";
        if (interactive && onChange) {
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} yıldız`}
              className="rounded p-0.5 text-amber-400 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e9aa7]"
              onClick={() => onChange(n)}
            >
              <Star className={common} fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 1.6} />
            </button>
          );
        }
        return (
          <Star key={n} className={`${common} text-amber-400`} fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 1.6} />
        );
      })}
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

  const canSubmit = Boolean(viewer.userId && viewer.approvedReservationId && !viewer.hasExistingReview);

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

  const composerBlock = (() => {
    if (!viewer.userId) {
      return (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
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
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Bu ilandan rezervasyon yapanlar yorum yapabilir
        </div>
      );
    }
    return (
      <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Puanınız</p>
          <StarRow value={rating} interactive onChange={setRating} />
        </div>
        <div>
          <label htmlFor="listing-review-text" className="mb-1 block text-xs font-medium text-slate-600">
            Yorumunuz ({text.trim().length}/500, en az 20)
          </label>
          <textarea
            id="listing-review-text"
            value={text}
            onChange={(ev) => setText(ev.target.value.slice(0, 500))}
            rows={4}
            minLength={20}
            maxLength={500}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-[#0e9aa7] focus:outline-none focus:ring-1 focus:ring-[#0e9aa7]"
            placeholder="Deneyiminizi paylaşın (en az 20 karakter)…"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending || text.trim().length < 20 || rating < 1}
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#0e9aa7] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c8a96] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Gönderiliyor…" : "Yorum Gönder"}
        </button>
      </form>
    );
  })();

  return (
    <section className="rounded-2xl border border-slate-200 p-4">
      <h2 className="font-semibold text-slate-900">Yorumlar</h2>

      {comments.length > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-800">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
          <span>{averageScore.toFixed(1)}</span>
          <span className="font-normal text-slate-500">· {comments.length} yorum</span>
        </p>
      ) : null}

      {comments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#0e9aa7]/20 bg-[#f0fdfd] p-6 text-center">
          <Star className="mx-auto mb-3 h-10 w-10 text-[#0e9aa7]/30" />
          <p className="mb-1 font-medium text-slate-500">Henüz yorum yapılmamış</p>
          <p className="text-sm text-slate-400">İlk yorumu siz yazın!</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {comments.map((row) => {
            const { name } = profileFromRow(row);
            const d = new Date(row.olusturulma_tarihi);
            const dateStr = Number.isNaN(d.getTime()) ? "" : format(d, "dd.MM.yyyy", { locale: tr });
            return (
              <li key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0e9aa7]/15 text-sm font-bold text-[#0e9aa7]">
                    {initials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">{name}</span>
                      <StarRow value={Number(row.puan ?? 0)} />
                      <span className="text-xs text-slate-400">{dateStr}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{fixTurkishDisplay(row.yorum)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">{composerBlock}</div>
    </section>
  );
}
