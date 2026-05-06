import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSettings } from "./actions";

type ProfilimPageProps = {
  searchParams: Promise<{ ok?: string; yukselt?: string }>;
};

export default async function ProfilimPage({ searchParams }: ProfilimPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris?redirect=/panel/profilim");

  const query = await searchParams;
  const { data: profile } = await supabase
    .from("kullanicilar")
    .select("ad_soyad")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900">Profil Ayarları</h1>
      {query.ok === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Profil bilgileriniz güncellendi.
        </div>
      ) : null}
      <form action={updateProfileSettings} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label htmlFor="ad_soyad" className="mb-1 block text-sm text-slate-700">
            Ad Soyad
          </label>
          <input
            id="ad_soyad"
            name="ad_soyad"
            defaultValue={profile?.ad_soyad ?? ""}
            required
            minLength={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-slate-700">
            E-posta
          </label>
          <input
            id="email"
            value={user.email ?? ""}
            readOnly
            className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="new_password" className="mb-1 block text-sm text-slate-700">
            Yeni Şifre
          </label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            minLength={6}
            placeholder="Değiştirmek istemiyorsanız boş bırakın"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">Şifre güncellemek için en az 6 karakter girin.</p>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
        >
          Değişiklikleri Kaydet
        </button>
      </form>
    </div>
  );
}
