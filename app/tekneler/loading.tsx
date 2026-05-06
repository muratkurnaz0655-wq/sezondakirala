export default function TeknelerLoading() {
  return (
    <div className="flex w-full flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
      </aside>
      <section className="space-y-4">
        <div className="skeleton h-8 w-40" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="skeleton aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
