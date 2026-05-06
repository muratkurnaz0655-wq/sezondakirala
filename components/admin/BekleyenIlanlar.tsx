import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export async function BekleyenIlanlar() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ilanlar")
    .select("id,baslik")
    .eq("aktif", false)
    .order("olusturulma_tarihi", { ascending: false })
    .limit(8);

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
          <CheckCircle className="h-6 w-6 text-emerald-600" />
        </div>
        <p className="font-medium text-slate-800">Onay bekleyen ilan yok</p>
        <p className="mt-1 text-sm text-slate-500">Tüm ilanlar incelendi ✓</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {data.map((row) => (
        <li key={row.id}>
          <Link
            href="/yonetim/ilanlar?durum=bekleyen"
            className="block rounded-lg border-b border-slate-100 px-2 py-3 text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50/70"
          >
            {row.baslik}
          </Link>
        </li>
      ))}
    </ul>
  );
}
