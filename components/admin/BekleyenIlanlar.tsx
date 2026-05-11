import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

function adminRscErrorBox(title: string, detail: string) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800">
      <p className="font-semibold">{title}</p>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-red-900">
        {detail}
      </pre>
    </div>
  );
}

/** Onay bekleyen ilanlar (admin liste ile aynı filtre: onay_durumu). */
export async function BekleyenIlanlar() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ilanlar")
      .select("id,baslik")
      .eq("onay_durumu", "onay_bekliyor")
      .order("olusturulma_tarihi", { ascending: false })
      .limit(8);

    if (error) {
      return adminRscErrorBox(
        "Onay bekleyen ilanlar yüklenemedi (Supabase)",
        `${error.message}\nKod: ${error.code ?? "-"}`,
      );
    }

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
          <li key={String(row.id)}>
            <Link
              href="/yonetim/ilanlar?durum=onay_bekliyor"
              className="block rounded-lg border-b border-slate-100 px-2 py-3 text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50/70"
            >
              {String(row.baslik ?? "Başlıksız")}
            </Link>
          </li>
        ))}
      </ul>
    );
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack ?? ""}` : String(e);
    return adminRscErrorBox("Onay bekleyen ilanlar bileşeni çöktü", msg);
  }
}
