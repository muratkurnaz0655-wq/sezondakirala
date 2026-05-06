"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type IlanSahibiYukseltCardProps = {
  vurgulu: boolean;
};

export function IlanSahibiYukseltCard({ vurgulu }: IlanSahibiYukseltCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const rolYukselt = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("kullanicilar").update({ rol: "ilan_sahibi" }).eq("id", user.id);

    if (error) {
      alert("Hata: " + error.message);
      return;
    }

    alert("Hesabınız İlan Sahibi olarak güncellendi!");
    router.refresh();
    window.location.reload();
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${
        vurgulu ? "border-sky-300 bg-gradient-to-br from-sky-50 to-blue-50 shadow-sm" : "border-slate-200 bg-white"
      }`}
    >
      <h2 className="text-lg font-semibold text-slate-900">İlan sahibi olun</h2>
      <p className="mt-1 text-sm text-slate-600">
        Villanızı veya teknenizi platformda listeleyerek kiraya verebilirsiniz. Hesap türünüz tek tıkla
        güncellenir.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void rolYukselt().finally(() => setPending(false));
        }}
        className="mt-4 w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
      >
        {pending ? "Güncelleniyor…" : "İlan sahibi hesabına geç"}
      </button>
    </div>
  );
}
