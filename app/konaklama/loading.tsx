export default function KonaklamaLoading() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="skeleton h-6 w-28" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      </aside>
      <section className="space-y-4">
        <div className="skeleton h-10 w-full max-w-xl rounded-xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="skeleton aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
