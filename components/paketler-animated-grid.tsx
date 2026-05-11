"use client";

import type { Paket } from "@/types/supabase";
import { ListingReveal } from "@/components/listing-reveal";
import { PackageCard } from "@/components/package-card";

export function PaketlerAnimatedGrid({ packages }: { packages: Paket[] }) {
  return (
    <ListingReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8" staggerMs={50}>
      {packages.map((paket) => (
        <PackageCard key={paket.id} paket={paket} />
      ))}
    </ListingReveal>
  );
}
