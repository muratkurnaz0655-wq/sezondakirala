"use client";

import { useEffect, useRef, useState } from "react";

type UseCountUpOptions = {
  durationMs?: number;
  enabled?: boolean;
  decimals?: number;
};

export function useCountUp(target: number, { durationMs = 1400, enabled = true, decimals = 0 }: UseCountUpOptions) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setValue(0));
      return;
    }
    if (target <= 0) {
      queueMicrotask(() => setValue(target));
      return;
    }
    queueMicrotask(() => setValue(0));
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const current = target * eased;
      const next =
        decimals > 0 ? Math.round(current * 10 ** decimals) / 10 ** decimals : Math.floor(current);
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, enabled, decimals]);

  return value;
}
