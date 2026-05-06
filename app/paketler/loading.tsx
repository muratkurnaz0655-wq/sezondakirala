const SkeletonKart = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-100 animate-pulse">
    <div className="h-48 w-full bg-slate-200" />
    <div className="space-y-3 p-4">
      <div className="h-4 w-3/4 rounded-full bg-slate-200" />
      <div className="h-3 w-1/2 rounded-full bg-slate-200" />
      <div className="h-3 w-2/3 rounded-full bg-slate-200" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-6 w-24 rounded-full bg-slate-200" />
        <div className="h-9 w-20 rounded-xl bg-slate-200" />
      </div>
    </div>
  </div>
);

export default function PaketlerLoading() {
  return (
    <div className="w-full py-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonKart key={i} />
        ))}
      </div>
    </div>
  );
}
