"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";

const resetSchema = z.object({
  email: z.string().email("Gecerli bir e-posta giriniz."),
});

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ResetValues) {
    setIsLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/giris`,
    });
    setIsLoading(false);
    setMessage(
      error
        ? error.message
        : "Sifre sifirlama baglantisi e-posta adresinize gonderildi.",
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Sifre Sifirla</h1>
      <p className="mt-1 text-sm text-slate-600">
        Kayitli e-posta adresinizi girin, size sifre sifirlama baglantisi
        gonderelim.
      </p>

      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <label className="text-sm text-slate-700">E-posta</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="email"
            {...form.register("email")}
          />
          <p className="text-xs text-red-500">{form.formState.errors.email?.message}</p>
        </div>

        <button
          className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Isleniyor..." : "Sifirlama Linki Gonder"}
        </button>
      </form>

      {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
