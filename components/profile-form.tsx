"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/profile";

const profileSchema = z.object({
  ad_soyad: z.string().min(3, "Ad soyad en az 3 karakter olmali."),
  telefon: z.string().min(10, "Telefon numarasi gecersiz."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileFormProps = {
  defaultName: string;
  defaultPhone: string;
  defaultAvatarUrl: string | null;
};

export function ProfileForm({
  defaultName,
  defaultPhone,
  defaultAvatarUrl,
}: ProfileFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ad_soyad: defaultName,
      telefon: defaultPhone,
    },
  });

  function onSubmit(values: ProfileFormValues) {
    const payload = new FormData();
    payload.set("ad_soyad", values.ad_soyad);
    payload.set("telefon", values.telefon);
    const fileInput = document.querySelector<HTMLInputElement>("#avatar");
    if (fileInput?.files?.[0]) payload.set("avatar", fileInput.files[0]);

    startTransition(async () => {
      const result = await updateProfile(payload);
      setMessage(result.success ? "Profil guncellendi." : result.error ?? "Hata olustu.");
      if (result.success) {
        toast.success("Değişiklikler kaydedildi");
      } else {
        toast.error("Bir hata oluştu, tekrar deneyin");
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
          {defaultAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={defaultAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <input id="avatar" type="file" accept="image/*" />
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-700">Ad Soyad</label>
        <input
          {...form.register("ad_soyad")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-red-500">{form.formState.errors.ad_soyad?.message}</p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-700">Telefon</label>
        <input
          {...form.register("telefon")}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-red-500">{form.formState.errors.telefon?.message}</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[#0e9aa7] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#0e9aa7]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Kaydediliyor..." : "Profili Kaydet"}
      </button>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </form>
  );
}
