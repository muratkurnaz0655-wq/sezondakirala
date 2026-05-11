"use client";

type StatTone = "default" | "success" | "warning" | "danger" | "info" | "purple";

type StatItem = {
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: StatTone;
};

/** Sol kenar vurgusu — admin_panel_kapsamli_prompt.md tasarım sistemi */
const toneBorder: Record<StatTone, string> = {
  default: "border-l-[#185FA5]",
  success: "border-l-[#1D9E75]",
  warning: "border-l-[#F59E0B]",
  danger: "border-l-[#EF4444]",
  info: "border-l-[#8B5CF6]",
  purple: "border-l-[#8B5CF6]",
};

export function AdminStatsRow({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => {
        const tone = item.tone ?? "default";
        return (
          <div
            key={item.label}
            className={`rounded-xl border border-[#E2E8F0] border-l-4 bg-white px-6 py-5 shadow-sm transition-shadow duration-200 hover:shadow-md ${toneBorder[tone]}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{item.label}</p>
            <p className="mt-1 text-[28px] font-semibold leading-tight text-[#1E293B]">{item.value}</p>
            {item.subtitle ? <p className="mt-1 text-xs text-[#64748B]">{item.subtitle}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
