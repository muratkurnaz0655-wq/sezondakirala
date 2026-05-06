"use client";

import { useMemo } from "react";
import { SearchForm } from "@/components/search-form";
import { istanbulDateString } from "@/lib/tr-today";

export function HeroAramaFormu() {
  const bugunIso = useMemo(() => istanbulDateString(), []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <SearchForm bugunIso={bugunIso} embedded />
    </div>
  );
}
