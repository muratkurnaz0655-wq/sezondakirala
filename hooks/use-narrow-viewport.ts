"use client";

import { useLayoutEffect, useState } from "react";

/**
 * ≤maxPx genişlikte true. SSR / ilk tick’te null (mobilde güvenli: parallax kapalı).
 */
export function useNarrowViewport(maxPx = 768) {
  const [narrow, setNarrow] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const query = `(max-width: ${maxPx}px)`;
    const mq = window.matchMedia(query);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [maxPx]);

  return narrow;
}
