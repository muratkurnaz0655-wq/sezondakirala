"use client";

type StatTone = "default" | "success" | "warning" | "danger" | "info" | "purple";

type StatItem = {
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: StatTone;
};

const toneClasses: Record<StatTone, string> = {
  default: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  purple: "border-purple-200 bg-purple-50 text-purple-800",
};

export function AdminStatsRow({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-9">
      {items.map((item) => {
        const tone = item.tone ?? "default";
        return (
          <div key={item.label} className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
            {item.subtitle ? <p className="mt-1 text-xs opacity-80">{item.subtitle}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
