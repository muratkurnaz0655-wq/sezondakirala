"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminGirisForm() {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [goster, setGoster] = useState(false);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [oturumYenileniyor, setOturumYenileniyor] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const renewAdminCookie = async () => {
      try {
        const res = await fetch("/api/admin/giris", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        const body = (await res.json().catch(() => ({}))) as { basarili?: boolean };
        if (!cancelled && res.ok && body.basarili === true) {
          router.replace("/yonetim");
          router.refresh();
          return;
        }
      } catch {
        // no-op: normal login form gösterilecek
      } finally {
        if (!cancelled) setOturumYenileniyor(false);
      }
    };
    void renewAdminCookie();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: sifre,
    });
    if (signInError) {
      setHata("E-posta veya şifre hatalı.");
      setYukleniyor(false);
      return;
    }

    const res = await fetch("/api/admin/giris", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { basarili?: boolean; hata?: string };

    if (res.ok && data.basarili === true) {
      router.push("/yonetim");
      router.refresh();
    } else {
      setHata(data.hata ?? (res.status === 401 ? "Oturum geçersiz." : "Admin girişi başarısız."));
      await supabase.auth.signOut();
      setYukleniyor(false);
    }
  };

  return (
    <form onSubmit={(ev) => void handleSubmit(ev)}>
      <div className="mb-6">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">E-posta</label>
        <div className="relative mb-4">
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@site.com"
            required
            className="w-full rounded-xl py-3.5 pl-4 pr-4 text-sm text-white outline-none transition-all placeholder:text-gray-600"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Şifre</label>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type={goster ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-xl py-3.5 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-gray-600"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0ea5e9";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          />
          <button
            type="button"
            onClick={() => setGoster(!goster)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-200 hover:text-gray-300 active:scale-[0.98]"
            aria-label={goster ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {goster ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {hata ? (
        <div
          className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-400"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertCircle size={14} />
          {hata}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={yukleniyor || oturumYenileniyor || !sifre || !email}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
          boxShadow: "0 4px 20px rgba(14,165,233,0.25)",
        }}
      >
        {oturumYenileniyor ? "Oturum kontrol ediliyor..." : yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
