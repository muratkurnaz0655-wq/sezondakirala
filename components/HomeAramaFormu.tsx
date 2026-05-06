"use client";

import { SearchForm } from "@/components/search-form";

/** Ana sayfa hero içi arama — Client Component (Server page’ten güvenle kullanılır). */
export function HomeAramaFormu({ bugunIso }: { bugunIso: string }) {
  return <SearchForm bugunIso={bugunIso} />;
}
