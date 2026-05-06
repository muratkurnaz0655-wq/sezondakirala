"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";
import { useCountUp } from "@/hooks/use-count-up";

export type HomeStatItem = { num: string; label: string; icon: ReactNode };

function parseStat(num: string): { value: number; suffix: string; decimals: number } | null {
  const mPlus = num.match(/^(\d+)\+$/);
  if (mPlus) return { value: Number(mPlus[1]), suffix: "+", decimals: 0 };
  const mFloat = num.match(/^(\d+\.\d+)$/);
  if (mFloat) return { value: Number(mFloat[1]), suffix: "", decimals: 1 };
  return null;
}

function StatCellNumeric({ item, parsed }: { item: HomeStatItem; parsed: { value: number; suffix: string; decimals: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const enabled = inView && !reduce;
  const count = useCountUp(parsed.value, {
    enabled,
    durationMs: 1600,
    decimals: parsed.decimals,
  });

  const display = `${parsed.decimals > 0 ? count.toFixed(1) : Math.round(count)}${parsed.suffix}`;

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-3"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="text-2xl" aria-hidden>
        {item.icon}
      </span>
      <div>
        <div className="text-lg font-bold leading-none text-slate-900">{display}</div>
        <div className="mt-0.5 text-xs text-slate-500">{item.label}</div>
      </div>
    </motion.div>
  );
}

function StatCellStatic({ item }: { item: HomeStatItem }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="text-2xl" aria-hidden>
        {item.icon}
      </span>
      <div>
        <div className="text-lg font-bold leading-none text-slate-900">{item.num}</div>
        <div className="mt-0.5 text-xs text-slate-500">{item.label}</div>
      </div>
    </motion.div>
  );
}

export function HomeStatsBand({ items }: { items: HomeStatItem[] }) {
  return (
    <div className="relative z-10 -mx-4 isolate border-b border-sky-100 bg-white py-6 shadow-sm md:py-4">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-5 md:gap-12">
          {items.map((item) => {
            const parsed = parseStat(item.num);
            if (parsed) {
              return <StatCellNumeric key={item.label} item={item} parsed={parsed} />;
            }
            return <StatCellStatic key={item.label} item={item} />;
          })}
        </div>
      </div>
    </div>
  );
}
