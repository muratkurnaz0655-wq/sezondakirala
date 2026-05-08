"use client";

import { useEffect, useRef } from "react";

const PING_INTERVAL_MS = 5 * 60 * 1000;
const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000;
const RELOAD_COOLDOWN_MS = 5 * 60 * 1000;

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

function shouldReload() {
  if (typeof window === "undefined") return false;
  const lastReload = Number(window.sessionStorage.getItem("admin_last_reload_at") ?? 0);
  return now() - lastReload > RELOAD_COOLDOWN_MS;
}

function markReload() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("admin_last_reload_at", String(now()));
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
        if (shouldReload()) {
          markReload();
          window.location.reload();
        }
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
        if (!response.ok && shouldReload()) {
          markReload();
          window.location.reload();
        }
      } catch {
        if (shouldReload()) {
          markReload();
          window.location.reload();
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const runRecoveryChecks = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      try {
        const lastActivity = getStorageNumber("admin_last_activity_at");
        const isStale = lastActivity != null && now() - lastActivity > STALE_THRESHOLD_MS;
        if (isStale && shouldReload()) {
          markReload();
          window.location.reload();
          return;
        }

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
