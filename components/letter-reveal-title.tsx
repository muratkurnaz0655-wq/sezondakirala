"use client";

import { motion, useReducedMotion } from "framer-motion";

const ease = [0.4, 0, 0.2, 1] as const;

/** Kelime + aradaki boşlukları sırayla döndürür (boşluklar ayrı segment). */
function segmentPreservingWhitespace(text: string): string[] {
  const parts = text.split(/(\s+)/);
  return parts.filter((p) => p.length > 0);
}

export function LetterRevealTitle({
  text,
  className,
  startIndex = 0,
}: {
  text: string;
  className?: string;
  /** Kümulatif gecikme için başlangıç indeksi (çok satırda) */
  startIndex?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <span className={className}>{text}</span>;
  }

  const segments = segmentPreservingWhitespace(text);
  let charCursor = startIndex;

  return (
    <span className={className} aria-hidden>
      {segments.map((segment, si) => {
        if (/^\s+$/.test(segment)) {
          return (
            <span key={`sp-${si}`} className="inline">
              {Array.from(segment).map((ch, i) => {
                const delayIndex = charCursor++;
                return (
                  <motion.span
                    key={`sp-${si}-${i}-${delayIndex}`}
                    className="inline-block align-baseline pb-[0.18em]"
                    style={{ whiteSpace: "pre" }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: delayIndex * 0.02,
                      ease,
                    }}
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </motion.span>
                );
              })}
            </span>
          );
        }

        const chars = Array.from(segment);
        return (
          <span key={`w-${si}`} className="inline-block whitespace-nowrap align-baseline">
            {chars.map((ch, i) => {
              const delayIndex = charCursor++;
              return (
                <motion.span
                  key={`w-${si}-${i}-${delayIndex}`}
                  className="inline-block align-baseline pb-[0.18em]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: delayIndex * 0.02,
                    ease,
                  }}
                >
                  {ch}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}
