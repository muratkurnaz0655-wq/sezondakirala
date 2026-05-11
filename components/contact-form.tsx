"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { mesajGonderState, type ContactFormState } from "@/app/iletisim/actions";

const INITIAL_STATE: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(mesajGonderState, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      toast.success("Mesajınız İletildi!", {
        description: "En kısa sürede sizinle iletişime geçeceğiz.",
        position: "top-right",
        duration: 4000,
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        className: "toast-slide-in",
        style: {
          background: "#ecfdf5",
          border: "1px solid #86efac",
          color: "#14532d",
        },
      });
    }
    if (state.status === "error") {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.", {
        position: "top-right",
        duration: 4000,
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        className: "toast-slide-in",
        style: {
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          color: "#7f1d1d",
        },
      });
    }
  }, [state]);

  return (
    <form ref={formRef} className="mt-6 space-y-4" action={formAction}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ad Soyad</label>
        <input
          required
          name="ad"
          type="text"
          placeholder="Adınız Soyadınız"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">E-posta</label>
          <input
            required
            name="email"
            type="email"
            placeholder="ornek@mail.com"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Telefon</label>
          <input
            name="telefon"
            type="tel"
            placeholder="+90 5xx xxx xx xx"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Konu</label>
        <input
          name="konu"
          type="text"
          placeholder="Konu"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mesajınız</label>
        <textarea
          required
          name="mesaj"
          rows={5}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20"
          placeholder="Mesajınızı yazın..."
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1D9E75] px-5 py-3.5 text-sm font-semibold text-white transition-all hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <span className="inline-spinner" aria-hidden />
            <span className="sr-only">Yükleniyor</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Mesaj Gönder
          </>
        )}
      </button>
    </form>
  );
}
