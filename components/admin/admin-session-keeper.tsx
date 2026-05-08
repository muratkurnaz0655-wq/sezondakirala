"use client";

import { useEffect, useRef } from "react";

const PING_INTERVAL_MS = 5 * 60 * 1000;

function now() {
  return Date.now();
}

function getStorageNumber(key: string) {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function setStorageNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}

export function AdminSessionKeeper() {
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const touchActivity = () => setStorageNumber("admin_last_activity_at", now());

    const pingAdminSession = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch("/api/admin/session/ping", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.location.href = "/yonetim/giris?reason=session";
        }
      } catch {
        // Ağ veya geçici webview sorunlarında otomatik reload döngüsüne girmemek için
        // burada sessizce bırakıp bir sonraki periyotta tekrar deneriz.
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const pingHealth = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch("/api/health", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
      } catch {
        return;
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const runRecoveryChecks = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      try {
        await pingHealth();
        await pingAdminSession();
        touchActivity();
      } finally {
        isCheckingRef.current = false;
      }
    };

    touchActivity();
    const onVisible = () => {
      if (document.visibilityState === "visible") void runRecoveryChecks();
    };
    const onFocus = () => void runRecoveryChecks();
    const onOnline = () => void runRecoveryChecks();
    const onAnyActivity = () => touchActivity();

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("mousemove", onAnyActivity);
    window.addEventListener("keydown", onAnyActivity);
    window.addEventListener("click", onAnyActivity);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void runRecoveryChecks();
    }, PING_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("mousemove", onAnyActivity);
      window.removeEventListener("keydown", onAnyActivity);
      window.removeEventListener("click", onAnyActivity);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
