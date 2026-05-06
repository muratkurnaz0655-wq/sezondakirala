const SkeletonKart = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-100 animate-pulse">
    <div className="h-24 w-full bg-slate-100" />
    <div className="space-y-3 p-4">
      <div className="h-4 w-2/3 rounded-full bg-slate-200" />
      <div className="h-3 w-1/2 rounded-full bg-slate-200" />
      <div className="h-3 w-3/4 rounded-full bg-slate-200" />
    </div>
  </div>
);

export default function PanelLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <SkeletonKart key={i} />
      ))}
    </div>
  );
}
