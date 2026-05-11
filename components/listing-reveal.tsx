"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

type ListingRevealProps = {
  children: ReactNode;
  className?: string;
  /** ms between each child when revealing */
  staggerMs?: number;
};

/**
 * Scroll ile görünürlük + çocuklara kademeli gecikme (Intersection Observer).
 */
export function ListingReveal({ children, className, staggerMs = 50 }: ListingRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true);
      },
      { rootMargin: "60px 0px", threshold: 0.02 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {Children.map(children, (child, i) => (
        <div
          key={i}
          className={`listing-reveal-item motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
          style={{ transitionDelay: visible ? `${i * staggerMs}ms` : "0ms" }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
