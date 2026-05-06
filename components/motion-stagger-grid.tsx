"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Children, isValidElement, type ReactNode } from "react";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const pageEase = [0.4, 0, 0.2, 1] as const;

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: pageEase },
  },
};

type MotionStaggerGridProps = {
  children: ReactNode;
  className?: string;
};

export function MotionStaggerGrid({ children, className }: MotionStaggerGridProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {Children.map(children, (child, i) => {
        const key = isValidElement(child) && child.key != null ? String(child.key) : `stagger-${i}`;
        return (
          <motion.div key={key} variants={item} className="flex min-h-0 min-w-0 h-full">
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
