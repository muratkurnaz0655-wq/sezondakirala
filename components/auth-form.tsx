"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserProfile } from "@/app/actions/user";
import { createClient } from "@/lib/supabase/client";
import { SITE_NAME } from "@/lib/constants";

const signInSchema = z.object({
  email: z.string().email("Geçerli bir e-posta giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
});

const signUpSchema = z
  .object({
    adSoyad: z.string().min(3, "Ad Soyad zorunludur."),
    email: z.string().email("Geçerli bir e-posta giriniz."),
    telefon: z
      .string()
      .regex(/^05\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/, "Telefon formatı: 05XX XXX XX XX"),
    password: z.string().min(1, "Şifre zorunludur."),
    confirmPassword: z.string().min(1, "Şifre tekrarı zorunludur."),
    hesapTuru: z.enum(["ziyaretci", "ilan_sahibi"]),
    termsAccepted: z.boolean().refine((value) => value, {
      message: "Kullanım koşullarını kabul etmelisiniz.",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

type AuthFormProps = {
  mode: "signin" | "signup";
  redirectTo?: string;
};

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [roleInfoOpen, setRoleInfoOpen] = useState<"ziyaretci" | "ilan_sahibi" | "terms" | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      adSoyad: "",
      email: "",
      telefon: "",
      password: "",
      confirmPassword: "",
      hesapTuru: "ziyaretci",
      termsAccepted: false,
    },
  });

  const requestedRedirect = searchParams.get("redirect") ?? redirectTo ?? "/";
  const incomingMessage = searchParams.get("message");
  async function onSignIn(values: SignInValues) {
    setIsLoading(true);
    setMessage(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setIsLoading(false);
      setMessage(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("kullanicilar")
      .select("rol")
      .eq("id", user?.id ?? "")
      .maybeSingle();

    setIsLoading(false);
    setMessage("Başarıyla giriş yaptınız.");
    if (profile?.rol === "ilan_sahibi") {
      const r = requestedRedirect.trim();
      if (r.startsWith("/rezervasyon/")) {
        router.push(r);
        return;
      }
      router.push("/panel/ilanlarim");
      return;
    }
    router.push(requestedRedirect);
  }

  async function onSignUp(values: SignUpValues) {
    setIsLoading(true);
    setMessage(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/giris`,
      },
    });

    if (!error && data.user) {
      const profileResult = await createUserProfile({
        id: data.user.id,
        email: values.email,
        adSoyad: values.adSoyad,
        telefon: values.telefon,
        rol: values.hesapTuru,
      });
      if (!profileResult.success) {
        setIsLoading(false);
        setMessage(profileResult.error ?? "Profil oluşturulamadı.");
        return;
      }

      setIsLoading(false);
      if (values.hesapTuru === "ilan_sahibi") {
        router.push("/panel/ilanlarim");
      } else {
        router.push("/");
      }
      return;
    }

    setIsLoading(false);
    setMessage(
      error
        ? error.message
        : "Kayıt oluşturuldu. E-posta onay bağlantınızı kontrol edin.",
    );
  }

  const isSignIn = mode === "signin";

  if (isSignIn) {
    return (
      <div className="min-h-screen w-full bg-white lg:grid lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:flex">
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200"
            alt="Fethiye"
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117]/75 via-[#0f4c5c]/70 to-[#0e9aa7]/65" />
          <div className="relative z-10 flex flex-col justify-end p-12 text-white">
            <div className="text-4xl font-bold tracking-tight leading-tight md:text-5xl">
              Fethiye&apos;nin En Güzel
              <br />
              Villalarını Keşfet
            </div>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">
              500+ onaylı villa ve tekne ile unutulmaz tatil deneyimi
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur">
              <Shield size={16} className="text-[#22d3ee]" aria-hidden />
              <span className="text-sm">TURSAB Belgeli — Güvenli Kiralama</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8 text-center">
                <Link href="/" className="mb-6 inline-flex items-center justify-center gap-2">
                  <Image
                    src="/logo-clean.png"
                    alt="Sezondakirala"
                    width={300}
                    height={75}
                    priority
                    className="mx-auto h-14 w-auto object-contain"
                  />
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Tekrar Hoş Geldiniz</h1>
                <p className="mt-1 text-base text-slate-500">Hesabınıza giriş yapın</p>
              </div>

              {incomingMessage ? (
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {incomingMessage}
                </p>
              ) : null}

              <form className="space-y-4" onSubmit={signInForm.handleSubmit(onSignIn)}>
                <div className="space-y-1">
                  <label className="text-sm text-slate-500">E-posta</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/20"
                    type="email"
                    {...signInForm.register("email")}
                  />
                  <p className="text-xs text-red-500">{signInForm.formState.errors.email?.message}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm text-slate-500">Şifre</label>
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#22d3ee] transition-colors hover:bg-slate-100"
                      onClick={() => setShowSignInPassword((v) => !v)}
                      aria-label={showSignInPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showSignInPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/20"
                    type={showSignInPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...signInForm.register("password")}
                  />
                  <p className="text-xs text-red-500">{signInForm.formState.errors.password?.message}</p>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Beni hatırla
                </label>

                <button
                  className="w-full rounded-xl bg-gradient-to-r from-[#0e9aa7] to-[#22d3ee] px-4 py-3 text-sm font-bold text-[#0d1117] shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:from-[#22d3ee] hover:to-[#0e9aa7] active:scale-[0.98] disabled:opacity-50"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "İşleniyor..." : "Giriş Yap"}
                </button>
                <Link className="block text-center text-sm text-[#22d3ee] hover:underline" href="/sifre-sifirla">
                  Şifremi unuttum
                </Link>
                <p className="text-center text-sm text-slate-500">
                  Hesabın yok mu?{" "}
                  <Link href="/kayit" className="font-medium text-[#22d3ee] hover:underline">
                    Kayıt Ol
                  </Link>
                </p>
              </form>

              {message ? <p className="mt-4 text-center text-sm text-gray-700">{message}</p> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[70vh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
      <aside
        className="hidden flex-col justify-between bg-[#ecfeff] p-8 text-white md:flex"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(13,17,23,0.58), rgba(15,76,92,0.78)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div>
          <Image src="/logo-clean.png" alt="Sezondakirala" width={300} height={75} priority className="h-10 w-auto object-contain" />
          <h2 className="mt-3 text-3xl font-bold">
            Fethiye&apos;de Güvenli Tatil Deneyimi
          </h2>
          <p className="mt-3 text-white">
            TURSAB güvencesiyle villa ve tekne rezervasyonunuzu kolayca tamamlayın.
          </p>
        </div>
        <div className="inline-flex w-fit rounded-full border border-[#22d3ee]/40 bg-[#22d3ee]/15 px-3 py-1 text-sm">
          ✅ TURSAB Belgeli Platform
        </div>
      </aside>

      <div className="p-6 md:p-8">
        <Image
          src="/logo-clean.png"
          alt="Sezondakirala"
          width={300}
          height={75}
          priority
          className="mx-auto h-14 w-auto object-contain"
        />
        <h1 className="text-2xl font-semibold text-slate-800">Kayıt Ol</h1>
        <p className="mt-1 text-sm text-slate-500">Yeni hesap oluşturarak hızlı rezervasyon yapın.</p>

        {incomingMessage ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {incomingMessage}
          </p>
        ) : null}

        <form
          className="mt-6 space-y-4"
          onSubmit={signUpForm.handleSubmit(onSignUp)}
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Hesap Türü</p>
            <label className="relative flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all has-[:checked]:border-[#0e9aa7] has-[:checked]:ring-2 has-[:checked]:ring-[#0e9aa7]/25 hover:border-slate-300">
              <input type="radio" value="ziyaretci" {...signUpForm.register("hesapTuru")} />
              <span className="flex-1 text-sm leading-snug">
                <span className="mr-1 text-lg" aria-hidden>
                  🏖️
                </span>
                <strong>Tatilci</strong> — Villa veya tekne kiralamak istiyorum
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setRoleInfoOpen((prev) => (prev === "ziyaretci" ? null : "ziyaretci"));
                  }}
                  className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-[#0e9aa7] hover:text-[#0e9aa7] hover:shadow-md active:scale-[0.98]"
                  aria-label="Tatilci hesap bilgisi"
                >
                  ?
                </button>
              </span>
              {roleInfoOpen === "ziyaretci" ? (
                <span className="absolute right-3 top-11 z-20 w-[min(280px,80vw)] rounded-xl border border-sky-100 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-xl">
                  Tatilci hesapla ilanları inceleyebilir, rezervasyon oluşturabilir, favori ekleyebilir
                  ve rezervasyon geçmişinizi panelden takip edebilirsiniz.
                </span>
              ) : null}
            </label>
            <label className="relative flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all has-[:checked]:border-[#22d3ee] has-[:checked]:ring-2 has-[:checked]:ring-[#22d3ee]/25 hover:border-slate-300">
              <input
                type="radio"
                value="ilan_sahibi"
                {...signUpForm.register("hesapTuru")}
              />
              <span className="flex-1 text-sm leading-snug">
                <span className="mr-1 text-lg" aria-hidden>
                  🏠
                </span>
                <strong>İlan Sahibi</strong> — Villam var, kiraya vermek istiyorum
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setRoleInfoOpen((prev) => (prev === "ilan_sahibi" ? null : "ilan_sahibi"));
                  }}
                  className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-[#0e9aa7] hover:text-[#0e9aa7] hover:shadow-md active:scale-[0.98]"
                  aria-label="İlan sahibi hesap bilgisi"
                >
                  ?
                </button>
              </span>
              {roleInfoOpen === "ilan_sahibi" ? (
                <span className="absolute right-3 top-11 z-20 w-[min(280px,80vw)] rounded-xl border border-emerald-100 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-xl">
                  İlan sahibi hesapla ilan ekleyebilir, takvim/fiyat yönetebilir, gelen talepleri
                  görebilir ve onay süreçlerini panelden yönetebilirsiniz.
                </span>
              ) : null}
            </label>
            <p className="text-xs text-red-500">
              {signUpForm.formState.errors.hesapTuru?.message}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-500">Ad Soyad</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/20"
              type="text"
              {...signUpForm.register("adSoyad")}
            />
            <p className="text-xs text-red-500">
              {signUpForm.formState.errors.adSoyad?.message}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-500">E-posta</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/20"
              type="email"
              {...signUpForm.register("email")}
            />
            <p className="text-xs text-red-500">
              {signUpForm.formState.errors.email?.message}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-500">Telefon</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/20"
              type="tel"
              placeholder="05XX XXX XX XX"
              {...signUpForm.register("telefon")}
            />
            <p className="text-xs text-red-500">
              {signUpForm.formState.errors.telefon?.message}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-slate-500">Şifre</label>
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#0e9aa7] transition-colors hover:bg-slate-100"
                onClick={() => setShowSignUpPassword((v) => !v)}
                aria-label={showSignUpPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showSignUpPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/20"
              type={showSignUpPassword ? "text" : "password"}
              {...signUpForm.register("password")}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm text-slate-500">Şifre Tekrarı</label>
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#0e9aa7] transition-colors hover:bg-slate-100"
                onClick={() => setShowSignUpConfirmPassword((v) => !v)}
                aria-label={showSignUpConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showSignUpConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 transition-all focus:border-[#0e9aa7] focus:ring-2 focus:ring-[#0e9aa7]/20"
              type={showSignUpConfirmPassword ? "text" : "password"}
              {...signUpForm.register("confirmPassword")}
            />
            <p className="text-xs text-red-500">
              {signUpForm.formState.errors.confirmPassword?.message}
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-500">
              <input type="checkbox" {...signUpForm.register("termsAccepted")} />
              <span>Kullanım koşullarını kabul ediyorum</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setRoleInfoOpen((prev) => (prev === "terms" ? null : "terms"));
                }}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-[#0e9aa7] hover:text-[#0e9aa7] hover:shadow-md active:scale-[0.98]"
                aria-label="Kullanım koşulları hakkında bilgi"
              >
                ?
              </button>
            </label>
            {roleInfoOpen === "terms" ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                Bu onay ile platformun kullanım kurallarını kabul etmiş olursunuz: doğru ve güncel bilgi
                paylaşımı, rezervasyon ve iptal süreçlerinde belirtilen koşullara uyum, ilan ve içeriklerde
                hukuka aykırı kullanım yapmama ve gizlilik politikasına uygun hareket etme. Detaylar için{" "}
                <Link href="/kvkk" className="font-semibold text-[#0e9aa7] hover:underline">
                  KVKK Aydınlatma Metni
                </Link>{" "}
                sayfasını inceleyebilirsiniz.
              </div>
            ) : null}
            <p className="text-xs text-red-500">
              {signUpForm.formState.errors.termsAccepted?.message}
            </p>
          </div>

          <button
            className="w-full rounded-xl bg-gradient-to-r from-[#0e9aa7] to-[#22d3ee] px-4 py-2.5 text-sm font-bold text-[#0d1117] shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] hover:from-[#22d3ee] hover:to-[#0e9aa7] active:scale-[0.98] disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "İşleniyor..." : "Kayıt Ol"}
          </button>
          <p className="text-center text-sm text-slate-500">
            Zaten hesabınız var mı?{" "}
            <Link href="/giris" className="font-semibold text-[#22d3ee] hover:underline">
              Giriş Yapın
            </Link>
          </p>
        </form>

        {message ? <p className="toast-slide-in mt-4 text-sm text-slate-700">{message}</p> : null}
      </div>
    </div>
  );
}
