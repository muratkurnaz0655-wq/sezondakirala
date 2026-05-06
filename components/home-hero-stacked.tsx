"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { LetterRevealTitle } from "@/components/letter-reveal-title";
import { HeroVideo } from "@/components/hero-video";
import { HeroAramaFormu } from "@/components/hero-arama-formu";

const pageEase = [0.4, 0, 0.2, 1] as const;

export function HomeHeroStacked() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  /** Kullanıcı isteği: Hero video tamamen sabit kalsın (parallax kapalı). */
  const disableVideoParallax = true;

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-hidden">
      <section
        ref={sectionRef}
        className="hero-stacked-video relative isolate w-full bg-[#0d1117] text-white max-md:flex max-md:flex-col max-md:[touch-action:pan-y] md:min-h-[85vh]"
      >
        <div className="hero-video-inner pointer-events-none absolute inset-0 z-0 overflow-visible">
          <motion.div
            style={undefined}
            className={
              disableVideoParallax
                ? "absolute inset-0 min-h-full"
                : "absolute inset-0 min-h-full will-change-transform"
            }
          >
            <HeroVideo />
          </motion.div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(13,17,23,0.6) 0%, rgba(13,17,23,0.4) 55%, rgba(13,17,23,0.8) 100%)",
              zIndex: 1,
            }}
            aria-hidden
          />
        </div>

        <motion.div
          className="relative z-20 mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 py-10 md:min-h-0 md:px-8 md:py-20 max-md:min-h-0 max-md:flex-1 max-md:[touch-action:pan-y]"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: pageEase }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.span
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0e9aa7]/30 bg-[#0e9aa7]/10 px-4 py-1.5 text-sm text-[#22d3ee]/90 backdrop-blur-sm"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: pageEase }}
            >
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#22d3ee]" />
              Fethiye&apos;nin En İyi Villa Ve Tekne Kiralama Platformu
            </motion.span>

            <h1
              className="heading-hero--video mb-4 text-3xl font-bold leading-tight tracking-tight text-[#e2e8f0] sm:text-4xl md:text-5xl lg:text-6xl"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
            >
              <span className="block">
                <LetterRevealTitle text="Hayalinizdeki Tatil" />
              </span>
              <span className="mt-1 block font-bold text-[#22d3ee] drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                <LetterRevealTitle
                  text="Fethiye'de Başlar"
                  startIndex={Array.from("Hayalinizdeki Tatil").length}
                />
              </span>
            </h1>

            <motion.p
              className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-[#94a3b8] sm:text-lg md:mb-10 md:text-xl"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: pageEase }}
            >
              Lüks villalar, özel tekneler ve TURSAB güvencesiyle unutulmaz tatil deneyimleri
            </motion.p>
          </div>

          <div
            className="search-form-card pointer-events-auto relative z-30 mt-2 w-full max-w-6xl shrink-0 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-2xl shadow-black/15 backdrop-blur-md md:p-6"
            style={undefined}
          >
            <div className="mb-4 md:mb-5">
              <p className="text-sm font-semibold text-slate-800">Tarih ve misafir seçin</p>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                Müsait villaları listelemek için giriş — çıkış aralığını seçin, ardından Villa Ara&apos;ya basın.
              </p>
            </div>

            <HeroAramaFormu />

            <details className="search-form-tips mt-4 rounded-xl border border-[#0e9aa7]/20 bg-[#0d1117] p-3 text-sm md:hidden">
              <summary className="cursor-pointer font-medium text-[#94a3b8]">Arama ipuçları</summary>
              <p className="mt-2 text-[#94a3b8]">
                Giriş ve çıkış için ayrı alanlara dokunun; tek takvimde aralık seçebilirsiniz.
              </p>
            </details>
          </div>
        </motion.div>
        <button
          type="button"
          className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 animate-bounce"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
          aria-label="Keşfet"
        >
          <span className="text-xs uppercase tracking-widest text-white/60">Keşfet</span>
          <ChevronDown className="h-5 w-5 text-white/60" />
        </button>
      </section>
    </div>
  );
}
