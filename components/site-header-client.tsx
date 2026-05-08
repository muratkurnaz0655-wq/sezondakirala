"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { Bell, CalendarDays, Home, UserPlus, XCircle } from "lucide-react";
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
    <header
      className="sticky top-0 z-50 w-full border-b border-cyan-200/80 shadow-sm backdrop-blur-md"
      style={{ background: "linear-gradient(90deg, rgba(220,252,231,0.96) 0%, rgba(207,250,254,0.96) 50%, rgba(224,242,254,0.96) 100%)" }}
    >
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
  const router = useRouter();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  const [user, setUser] = useState<User | null>(null);
  const [profil, setProfil] = useState<HeaderProfil>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      tip: string | null;
      baslik: string | null;
      mesaj: string | null;
      okundu: boolean;
      olusturulma_tarihi: string;
      hedef_kullanici_id?: string | null;
      entity_tip: string | null;
      entity_id: string | null;
    }[]
  >([]);
  const [authLoading, setAuthLoading] = useState(() => Boolean(isSupabaseEnvConfigured()));
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());

  const isVisibleForCurrentUser = (
    item: {
      hedef_kullanici_id?: string | null;
      entity_tip?: string | null;
      tip?: string | null;
    },
    currentUserId: string,
    isAdmin: boolean,
  ) => {
    if (item.hedef_kullanici_id === currentUserId) return true;
    // Global announcements for everyone.
    if (!item.hedef_kullanici_id && item.tip === "duyuru") return true;
    // Untargeted operational notifications are admin-only.
    if (isAdmin && !item.hedef_kullanici_id) return true;
    return false;
  };
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
    if (!user?.id || !isSupabaseEnvConfigured()) {
      setNotifications([]);
      setNotificationCount(0);
      seenNotificationIdsRef.current = new Set();
      return;
    }
    let mounted = true;
    const supabase = createClient();

    const syncNotifications = async (showToastForNew: boolean) => {
      const [rowsResult, countResult] = await Promise.all([
        supabase.from("bildirimler").select("*").order("olusturulma_tarihi", { ascending: false }).limit(20),
        supabase.from("bildirimler").select("*", { count: "exact", head: true }).eq("okundu", false),
      ]);
      if (!mounted) return;
      const allRows = (rowsResult.data as typeof notifications) ?? [];
      const legacyReservationRows = allRows.filter(
        (item) => !item.hedef_kullanici_id && item.entity_tip === "rezervasyon" && Boolean(item.entity_id),
      );

      let ownedLegacyReservationIds = new Set<string>();
      if (legacyReservationRows.length) {
        const { data: ownedReservations } = await supabase
          .from("rezervasyonlar")
          .select("id")
          .in("id", legacyReservationRows.map((item) => String(item.entity_id)));
        ownedLegacyReservationIds = new Set((ownedReservations ?? []).map((item) => item.id));
      }

      const rows = allRows.filter((item) => {
        if (!item.hedef_kullanici_id && item.entity_tip === "rezervasyon" && item.entity_id) {
          return ownedLegacyReservationIds.has(String(item.entity_id));
        }
        return isVisibleForCurrentUser(item, user.id, profil?.rol === "admin");
      });
      const unreadCount = rows.filter((item) => !item.okundu).length;
      setNotifications(rows);
      setNotificationCount(unreadCount);

      const previous = seenNotificationIdsRef.current;
      const current = new Set(rows.map((item) => item.id));
      if (showToastForNew) {
        const newlyArrived = rows.filter((item) => !previous.has(item.id) && !item.okundu);
        newlyArrived.slice(0, 2).forEach((item) => {
          toast.success("! Yeni bildiriminiz var", {
            description: item.baslik ?? "Detay için zil ikonuna tıklayın.",
            position: "top-right",
            duration: 2000,
            style: {
              background: "#dcfce7",
              border: "1px solid #86efac",
              color: "#166534",
            },
          });
        });
      }
      seenNotificationIdsRef.current = current;
    };

    void syncNotifications(false);

    const intervalId = setInterval(() => {
      void syncNotifications(true);
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
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
    ? "border-b border-cyan-200/80 shadow-sm backdrop-blur-md"
    : "border-b border-cyan-200/70 shadow-sm backdrop-blur-md";

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

  const formatDate = (value: string) => {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const notificationTitle = (item: (typeof notifications)[number]) => {
    if (item.tip === "yeni_rezervasyon") return item.baslik ?? "Rezervasyonunuz oluşturuldu";
    if (item.tip === "iptal_rezervasyon") return "Rezervasyon iptal edildi";
    if (item.tip === "yeni_kullanici") return "Yeni kullanıcı kaydı";
    if (item.tip === "yeni_ilan") return "Yeni ilan eklendi";
    return item.baslik ?? "Bildirim";
  };

  const notificationIcon = (item: (typeof notifications)[number]) => {
    if (item.tip === "yeni_rezervasyon") {
      return { wrapper: "bg-blue-100 text-blue-700", Icon: CalendarDays };
    }
    if (item.tip === "yeni_kullanici") {
      return { wrapper: "bg-emerald-100 text-emerald-700", Icon: UserPlus };
    }
    if (item.tip === "iptal_rezervasyon") {
      return { wrapper: "bg-rose-100 text-rose-700", Icon: XCircle };
    }
    return { wrapper: "bg-amber-100 text-amber-700", Icon: Home };
  };

  function notificationHref(item: (typeof notifications)[number]) {
    if (item.entity_tip === "rezervasyon" && item.entity_id) return `/panel/rezervasyonlar/${item.entity_id}`;
    if (item.entity_tip === "rezervasyon") return "/panel/bildirimler";
    if (item.entity_tip === "ilan" && item.entity_id) return "/panel/ilanlarim";
    if (item.entity_tip === "kullanici" && item.entity_id) return "/panel/profilim";
    return "/panel/bildirimler";
  }

  async function resolveReservationHref(item: (typeof notifications)[number]) {
    if (item.entity_tip !== "rezervasyon") return null;
    if (item.entity_id) return `/panel/rezervasyonlar/${item.entity_id}`;

    const refMatch = (item.mesaj ?? "").match(/Rezervasyon No:\s*([A-Z0-9-]+)/i);
    const referansNo = refMatch?.[1]?.trim();
    if (!referansNo || !isSupabaseEnvConfigured()) return null;

    const supabase = createClient();
    const { data } = await supabase
      .from("rezervasyonlar")
      .select("id")
      .eq("referans_no", referansNo)
      .maybeSingle();
    if (!data?.id) return null;
    return `/panel/rezervasyonlar/${data.id}`;
  }

  async function openNotificationDetail(item: (typeof notifications)[number]) {
    if (!item.okundu) {
      await markNotificationRead(item.id);
    }
    setNotificationOpen(false);
    const reservationHref = await resolveReservationHref(item);
    router.push(reservationHref ?? notificationHref(item));
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ease-out ${headerShell}`}
      style={{ background: "linear-gradient(90deg, rgba(220,252,231,0.95) 0%, rgba(207,250,254,0.95) 50%, rgba(224,242,254,0.95) 100%)" }}
    >
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
                <div
                  className="absolute right-20 top-[4.5rem] z-50 hidden w-[340px] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl md:block"
                  style={{ borderWidth: "0.5px" }}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-800">Bildirimler</p>
                      {notificationCount > 0 ? (
                        <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                          {notificationCount > 99 ? "99+" : notificationCount}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700"
                    >
                      Tümünü okundu yap
                    </button>
                  </div>
                  <div className="max-h-96 overflow-auto p-2">
                    {notifications.length ? notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void openNotificationDetail(item)}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          item.okundu ? "hover:bg-slate-50" : "bg-blue-50/70 hover:bg-blue-100/70"
                        }`}
                      >
                        {(() => {
                          const { wrapper, Icon } = notificationIcon(item);
                          return (
                            <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${wrapper}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                          );
                        })()}
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-slate-800">{notificationTitle(item)}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{item.mesaj ?? "-"}</span>
                          <span className="mt-1 block text-[11px] text-slate-400">{formatDate(item.olusturulma_tarihi)}</span>
                        </span>
                        <span className="w-3 pt-1">
                          {!item.okundu ? <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" /> : null}
                        </span>
                      </button>
                    )) : (
                      <p className="px-3 py-6 text-center text-sm text-slate-500">Yeni bildirim yok</p>
                    )}
                  </div>
                  <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                    <Link
                      href="/panel/bildirimler"
                      className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
                      onClick={() => setNotificationOpen(false)}
                    >
                      Tüm bildirimleri gör -&gt;
                    </Link>
                  </div>
                </div>
              ) : null}
              <div className="hidden md:block">
                <UserDropdown user={user} profil={profil} variant={dropdownVariant} />
              </div>
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
