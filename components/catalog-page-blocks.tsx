import type { ReactNode } from "react";

export type CatalogTrustItem = {
  icon: string;
  title: string;
  text: string;
};

export function CatalogTrustStrip({ items }: { items: CatalogTrustItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <span className="text-2xl" aria-hidden>
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{item.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogProseSection({
  title,
  children,
  eyebrow,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-[#22d3ee]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-1 font-serif text-xl font-bold text-slate-900 md:text-2xl">{title}</h2>
      <div className="mt-4 max-w-none space-y-3 text-sm leading-relaxed text-slate-500 md:text-[0.95rem]">
        {children}
      </div>
    </div>
  );
}

export function CatalogHowItWorks({
  title,
  steps,
}: {
  title: string;
  steps: { n: string; title: string; desc: string }[];
}) {
  return (
    <div>
      <h2 className="mb-4 font-serif text-lg font-bold text-slate-900 md:text-xl">{title}</h2>
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="relative flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0e9aa7] to-[#0f4c5c] text-sm font-bold text-white">
              {s.n}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
