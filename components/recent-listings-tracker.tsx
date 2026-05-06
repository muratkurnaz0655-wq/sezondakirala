"use client";

import { useEffect } from "react";
import type { RecentListingEntry } from "@/lib/recent-listings";
import { pushRecentListing } from "@/lib/recent-listings";

type RecentListingsTrackerProps = {
  entry: RecentListingEntry;
};

export function RecentListingsTracker({ entry }: RecentListingsTrackerProps) {
  useEffect(() => {
    pushRecentListing(entry);
  }, [entry]);
  return null;
}
