"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { fixTurkishDisplay } from "@/lib/utils/turkish-display";
import type { RecentListingEntry } from "@/lib/recent-listings";
import { pruneRecentListingsToExistingIds, readRecentListings } from "@/lib/recent-listings";
import { createClient } from "@/lib/supabase/client";
import { isExcludedDraftListing } from "@/lib/utils/excluded-draft-listing";

export function HomeRecentListings() {
  const [items, setItems] = useState<RecentListingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function syncWithDatabase() {
      const initial = readRecentListings();
      if (initial.length === 0) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      const ids = [...new Set(initial.map((e) => e.id))];
      const supabase = createClient();
      const { data, error } = await supabase.from("ilanlar").select("id").in("id", ids);
      if (cancelled) return;
      if (error) {
        setItems(initial);
        setLoading(false);
        return;
      }
      const alive = new Set((data ?? []).map((r) => r.id));
      const next = pruneRecentListingsToExistingIds(alive);
      setItems(next);
      setLoading(false);
    }
    void syncWithDatabase();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="-mx-4 border-y border-sky-100 py-10" style={{ background: "#f0f9ff" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-sky-100" />
          <div className="mt-4 flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-56 w-64 shrink-0 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="-mx-4 border-y border-sky-100 py-10" style={{ background: "#f0f9ff" }}>
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="heading-section mb-4 text-slate-900">Son baktıklarınız</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.filter((item) => !isExcludedDraftListing({ baslik: item.baslik, aciklama: null })).map((item) => {
            const href = item.tip === "tekne" ? `/tekneler/${item.slug}` : `/konaklama/${item.slug}`;
            return (
              <Link
                key={item.id}
                href={href}
                className="card card-lift-interactive group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative h-36 bg-slate-100">
                  <Image
                    src={item.image}
                    alt={fixTurkishDisplay(item.baslik)}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="256px"
                  />
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {fixTurkishDisplay(item.baslik)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{fixTurkishDisplay(item.konum)}</p>
                  <p className="mt-2 text-sm font-semibold text-sky-600">
                    {formatCurrency(item.gunluk_fiyat)}
                    <span className="font-normal text-slate-500"> / gece</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
