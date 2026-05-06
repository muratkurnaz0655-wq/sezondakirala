"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const pageEase = [0.4, 0, 0.2, 1] as const;

type MotionFadeInProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
};

export function MotionFadeIn({ children, delay = 0, className, style }: MotionFadeInProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: pageEase }}
    >
      {children}
    </motion.div>
  );
}
