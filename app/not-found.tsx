import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#f0fdfd] to-white px-4">
      <div className="text-center">
        <p className="mb-4 text-8xl font-black text-[#0e9aa7]/20">404</p>
        <h1 className="mb-3 text-2xl font-bold text-slate-800">Sayfa bulunamadı</h1>
        <p className="mb-8 text-slate-500">Aradığınız sayfa taşınmış veya silinmiş olabilir.</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#0e9aa7] px-8 py-3.5 font-semibold text-white transition-all hover:bg-[#0f4c5c]"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
