"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HERO_VIDEO_SRC } from "@/lib/constants";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fallback, setFallback] = useState(false);

  useLayoutEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.playsInline = true;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const kickFromTouch = () => {
      try {
        video.muted = true;
        void video.play();
      } catch {
        /* iOS bazen ilk dokunuşta ister */
      }
    };
    window.addEventListener("touchstart", kickFromTouch, { passive: true, once: true });

    let cancelled = false;
    let tries = 0;
    const maxTries = 10;

    const attemptPlay = async () => {
      if (cancelled) return;
      tries += 1;
      try {
        video.muted = true;
        video.defaultMuted = true;
        await video.play();
      } catch {
        if (tries < maxTries) {
          window.setTimeout(() => void attemptPlay(), 120 * Math.min(tries, 5));
        } else if (!cancelled) {
          setFallback(true);
        }
      }
    };

    const kick = () => {
      if (!cancelled) void attemptPlay();
    };

    if (video.readyState >= 2) {
      kick();
    } else {
      video.addEventListener("canplay", kick, { once: true });
      video.addEventListener("loadeddata", kick, { once: true });
    }

    const onEnded = () => {
      if (cancelled) return;
      try {
        video.currentTime = 0;
        void video.play();
      } catch {
        /* bazı tarayıcılarda loop yedek */
      }
    };
    video.addEventListener("ended", onEnded);

    const onVisibility = () => {
      if (!document.hidden && !cancelled) void attemptPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted && !cancelled) void attemptPlay();
    };
    window.addEventListener("pageshow", onPageShow);

    const onError = () => {
      if (!cancelled) setFallback(true);
    };
    video.addEventListener("error", onError, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("touchstart", kickFromTouch);
      video.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      video.removeEventListener("error", onError);
      video.removeEventListener("canplay", kick);
      video.removeEventListener("loadeddata", kick);
    };
  }, []);

  if (fallback) {
    return (
      <div
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{
          background: "linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 40%, #166534 100%)",
        }}
        aria-hidden
      />
    );
  }

  return (
    <video
      key={HERO_VIDEO_SRC}
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      controls={false}
      preload="auto"
      disablePictureInPicture
      className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
      style={{ WebkitTransform: "translateZ(0)", transform: "translateZ(0)" }}
    >
      <source src={HERO_VIDEO_SRC} type="video/mp4" />
    </video>
  );
}
