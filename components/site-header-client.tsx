"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { MobileMenu } from "@/components/mobile-menu";
import { UserDropdown, type HeaderProfil } from "@/components/UserDropdown";

export type SiteHeaderClientProps = {
  siteName: string;
};

function HeaderSkeleton({ siteName }: { siteName: string }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="relative mx-auto flex min-h-16 w-full max-w-6xl animate-pulse items-center justify-between px-4 md:min-h-[5.25rem] md:px-5">
        <div className="h-8 w-36 rounded-lg bg-slate-100 md:h-9 md:w-40" />
        <div className="hidden gap-6 md:flex">
          <div className="h-5 w-20 rounded bg-slate-100" />
          <div className="h-5 w-24 rounded bg-slate-100" />
          <div className="h-5 w-16 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-28 rounded-full bg-slate-100" />
        <span className="sr-only">{`Sayfa hazırlanıyor — ${siteName}`}</span>
      </div>
      <div aria-hidden className="w-full overflow-hidden border-t border-[#0e9aa7]/20 bg-gradient-to-b from-[#0d1117] to-[#111827] leading-none">
        <div className="header-wave-track h-4 md:h-5">
          <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" className="block h-8 w-1/2 shrink-0 md:h-10" preserveAspectRatio="none">
            <path
              d="M0,28 C200,8 400,48 600,28 C800,8 1000,48 1200,28 C1320,16 1380,22 1440,28 L1440,48 L0,48 Z"
              className="fill-[#111827] drop-shadow-[0_2px_8px_rgba(14,154,167,0.25)]"
            />
          </svg>
          <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" className="block h-8 w-1/2 shrink-0 md:h-10" preserveAspectRatio="none">
            <path
              d="M0,28 C200,8 400,48 600,28 C800,8 1000,48 1200,28 C1320,16 1380,22 1440,28 L1440,48 L0,48 Z"
              className="fill-[#111827] drop-shadow-[0_2px_8px_rgba(14,154,167,0.25)]"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}

export function SiteHeaderClient({ siteName }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  const [user, setUser] = useState<User | null>(null);
  const [profil, setProfil] = useState<HeaderProfil>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<
    { id: string; baslik: string | null; mesaj: string | null; okundu: boolean; olusturulma_tarihi: string }[]
  >([]);
  const [selectedNotification, setSelectedNotification] = useState<{
    id: string;
    baslik: string | null;
    mesaj: string | null;
    olusturulma_tarihi: string;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(isSupabaseEnvConfigured()));
  useEffect(() => {
    if (!isSupabaseEnvConfigured()) {
      return;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id || !isSupabaseEnvConfigured()) {
      requestAnimationFrame(() => setProfil(null));
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("kullanicilar")
      .select("ad_soyad, rol")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfil(data);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isSupabaseEnvConfigured() || !user?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bildirimler" },
        (payload) => {
          const row = payload.new as {
            id: string;
            baslik: string | null;
            mesaj: string | null;
            okundu: boolean;
            olusturulma_tarihi: string;
          };
          setNotifications((prev) => [row, ...prev].slice(0, 20));
          if (!row.okundu) {
            setNotificationCount((prev) => prev + 1);
            toast.success("! Yeni bildiriminiz var", {
              description: row.baslik ?? "Detay için zil ikonuna tıklayın.",
              position: "top-right",
              duration: 4500,
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isSupabaseEnvConfigured()) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }
    const supabase = createClient();
    Promise.all([
      supabase.from("bildirimler").select("*").order("olusturulma_tarihi", { ascending: false }).limit(20),
      supabase.from("bildirimler").select("*", { count: "exact", head: true }).eq("okundu", false),
    ]).then(([rowsResult, countResult]) => {
      setNotifications((rowsResult.data as typeof notifications) ?? []);
      setNotificationCount(countResult.count ?? 0);
    });
  }, [user?.id]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (authLoading) {
    return <HeaderSkeleton siteName={siteName} />;
  }

  const _solidBar = scrolled || !isHome || reduce;
  const headerShell = _solidBar
    ? "border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md"
    : "border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md";

  const navLinkBase = "font-medium text-slate-600 transition-colors duration-200 hover:text-[#0e9aa7]";
  const girisClass = "text-slate-600 transition-colors duration-200 hover:text-slate-900";
  const dropdownVariant = "solid";
  const loggedIn = user !== null;

  async function markAllNotificationsRead() {
    if (!isSupabaseEnvConfigured()) return;
    const supabase = createClient();
    await supabase.rpc("mark_all_notifications_read");
    setNotifications((prev) => prev.map((item) => ({ ...item, okundu: true })));
    setNotificationCount(0);
  }

  async function markNotificationRead(notificationId: string) {
    if (!isSupabaseEnvConfigured()) return;
    const supabase = createClient();
    await supabase.rpc("mark_notification_read", { notification_id: notificationId });
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, okundu: true } : item)),
    );
    setNotificationCount((prev) => Math.max(0, prev - 1));
  }

  async function openNotificationDetail(item: {
    id: string;
    baslik: string | null;
    mesaj: string | null;
    okundu: boolean;
    olusturulma_tarihi: string;
  }) {
    setSelectedNotification({
      id: item.id,
      baslik: item.baslik,
      mesaj: item.mesaj,
      olusturulma_tarihi: item.olusturulma_tarihi,
    });
    if (!item.okundu) {
      await markNotificationRead(item.id);
    }
  }

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ease-out ${headerShell}`}>
      <div className="relative flex min-h-[4.5rem] w-full items-center justify-between gap-3 px-4 md:min-h-[5.5rem] md:gap-4 md:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 flex-1 items-center md:flex-none">
          <Image
            src="/logo-clean.png"
            alt="Sezondakirala"
            width={300}
            height={75}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav
          className="hidden items-center gap-6 text-[0.95rem] font-medium md:flex lg:gap-7 lg:text-base"
        >
          <Link href="/" className={`${navLinkBase} ${pathname === "/" ? "font-semibold text-[#0e9aa7]" : ""}`}>Ana Sayfa</Link>
          <Link href="/konaklama" className={`${navLinkBase} ${pathname.startsWith("/konaklama") ? "font-semibold text-[#0e9aa7]" : ""}`}>Konaklama</Link>
          <Link href="/tekneler" className={`${navLinkBase} ${pathname.startsWith("/tekneler") ? "font-semibold text-[#0e9aa7]" : ""}`}>Tekneler</Link>
          <Link href="/paketler" className={`${navLinkBase} ${pathname.startsWith("/paketler") ? "font-semibold text-[#0e9aa7]" : ""}`}>Paketler</Link>
          <Link href="/hakkimizda" className={`${navLinkBase} ${pathname.startsWith("/hakkimizda") ? "font-semibold text-[#0e9aa7]" : ""}`}>Hakkımızda</Link>
          <Link href="/sss" className={`${navLinkBase} ${pathname.startsWith("/sss") ? "font-semibold text-[#0e9aa7]" : ""}`}>SSS</Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {loggedIn ? (
            <>
              <button
                type="button"
                onClick={() => setNotificationOpen((current) => !current)}
                className={`relative hidden h-11 w-11 items-center justify-center rounded-full border text-base md:inline-flex ${
                  "border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                }`}
                aria-label="Bildirimler"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-white bg-red-600 px-1 text-[10px] font-bold text-white shadow">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                ) : null}
              </button>
              {notificationOpen ? (
                <div className="absolute right-20 top-[4.5rem] z-50 hidden w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl md:block">
                  <div className="mb-2 flex items-center justify-between px-2 py-1">
                    <p className="text-sm font-semibold text-slate-800">Bildirimler</p>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Tümünü okundu yap
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length ? notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void openNotificationDetail(item)}
                        className={`mb-1 block w-full rounded-xl border px-3 py-2 text-left ${item.okundu ? "border-slate-100 bg-slate-50" : "border-blue-100 bg-blue-50"}`}
                      >
                        <p className="text-sm font-semibold text-slate-800">{item.baslik ?? "Bildirim"}</p>
                        <p className="text-xs text-slate-600">{item.mesaj ?? ""}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{new Date(item.olusturulma_tarihi).toLocaleString("tr-TR")}</p>
                      </button>
                    )) : (
                      <p className="px-3 py-6 text-center text-sm text-slate-500">Yeni bildirim yok</p>
                    )}
                  </div>
                </div>
              ) : null}
              <div className="hidden md:block">
                <UserDropdown user={user} profil={profil} variant={dropdownVariant} />
              </div>
              {selectedNotification ? (
                <div
                  className="fixed inset-0 z-[60] hidden bg-black/40 md:block"
                  onClick={() => setSelectedNotification(null)}
                >
                  <div
                    className="absolute right-8 top-24 w-[26rem] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <p className="text-sm font-bold text-slate-900">{selectedNotification.baslik ?? "Bildirim"}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{selectedNotification.mesaj ?? "-"}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      {new Date(selectedNotification.olusturulma_tarihi).toLocaleString("tr-TR")}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setSelectedNotification(null)}
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Link
                href="/giris"
                className={`hidden rounded-xl px-4 py-2.5 text-[0.95rem] font-semibold transition-colors md:inline-flex lg:text-base ${girisClass}`}
              >
                Giriş Yap
              </Link>
              <Link
                href="/kayit"
                className={`hidden rounded-xl border px-5 py-2.5 text-[0.95rem] font-semibold transition-colors md:inline-flex lg:text-base ${
                  "bg-gradient-to-r from-[#0e9aa7] to-[#06b6d4] px-5 py-2 text-white font-bold rounded-xl shadow-lg shadow-[#0e9aa7]/30 hover:shadow-xl hover:shadow-[#0e9aa7]/40 hover:scale-105 active:scale-95 transition-all duration-200 border-transparent"
                }`}
              >
                Kayıt Ol →
              </Link>
            </>
          )}
        </div>

        <MobileMenu
          siteName={siteName}
          variant="solid"
          user={user}
          profil={profil}
        />
      </div>
    </header>
  );
}
