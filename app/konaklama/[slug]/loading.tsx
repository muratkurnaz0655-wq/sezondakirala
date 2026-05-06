export default function KonaklamaDetayLoading() {
  return (
    <div className="w-full animate-pulse space-y-8 pb-28 md:pb-0">
      <div className="space-y-3">
        <div className="h-9 w-2/3 max-w-xl rounded-lg bg-slate-200" />
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="h-6 w-32 rounded bg-slate-200" />
      </div>
      <div className="h-[min(70vh,520px)] w-full rounded-2xl bg-slate-200" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="h-48 rounded-2xl bg-slate-200" />
        </div>
        <div className="h-96 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
