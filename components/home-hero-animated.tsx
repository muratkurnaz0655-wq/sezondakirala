"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { LetterRevealTitle } from "@/components/letter-reveal-title";
import { HeroVideo } from "@/components/hero-video";
import { useNarrowViewport } from "@/hooks/use-narrow-viewport";

const pageEase = [0.4, 0, 0.2, 1] as const;

type HomeHeroAnimatedProps = {
  children: ReactNode;
};

export function HomeHeroAnimated({ children }: HomeHeroAnimatedProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const narrow = useNarrowViewport(768);
  const disableVideoParallax = reduce || narrow !== false;
  const { scrollY } = useScroll();
  const videoY = useTransform(scrollY, [0, 520], reduce ? [0, 0] : [0, 110]);

  return (
    <section
      ref={sectionRef}
      className="hero-video-section hero-section relative w-full overflow-hidden text-white"
    >
      <div className="hero-video-container pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          style={disableVideoParallax ? undefined : { y: videoY }}
          className={disableVideoParallax ? "absolute inset-0" : "absolute inset-0 will-change-transform"}
        >
          <HeroVideo />
        </motion.div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.75) 100%)",
            zIndex: 1,
          }}
          aria-hidden
        />
      </div>

      <motion.div
        className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-7xl items-center px-6 md:px-10"
        style={{ zIndex: 10 }}
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: pageEase }}
      >
        <div className="max-w-2xl">
          <motion.span
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-md"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: pageEase }}
          >
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400" />
            Fethiye&apos;nin En İyi Villa Ve Tekne Kiralama Platformu
          </motion.span>

          <h1 className="heading-hero mb-4 text-white">
            <span className="block">
              <LetterRevealTitle text="Hayalinizdeki Tatil" />
            </span>
            <span className="mt-1 block text-sky-300">
              <LetterRevealTitle
              text="Fethiye'de Başlar"
              startIndex={Array.from("Hayalinizdeki Tatil").length}
            />
            </span>
          </h1>

          <motion.p
            className="mb-10 max-w-xl text-xl leading-relaxed text-white/80"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: pageEase }}
          >
            Lüks villalar, özel tekneler ve TURSAB güvencesiyle
            <br />
            unutulmaz tatil deneyimleri
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: pageEase }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>

      <div
        className="pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce md:flex"
        aria-hidden
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/40 pt-2">
          <div className="h-2 w-1 rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  );
}
