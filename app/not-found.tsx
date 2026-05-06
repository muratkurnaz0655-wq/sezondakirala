import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex w-full items-center justify-center overflow-x-hidden py-10 sm:py-12 md:py-16">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl md:text-3xl">Aradığınız sayfa bulunamadı</h1>
        <p className="mt-3 text-slate-600">
          Link eski olabilir veya sayfa kaldırılmış olabilir. Ana sayfadan devam edebilirsiniz.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex w-full sm:w-auto min-h-11 items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-700"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
