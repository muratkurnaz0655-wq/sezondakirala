import type { ReactNode } from "react";

export function AdminDataTable({ children, minWidthClass = "min-w-[960px]" }: { children: ReactNode; minWidthClass?: string }) {
  return (
    <div className="hidden w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${minWidthClass}`}>{children}</table>
      </div>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-slate-200 bg-slate-50">{children}</thead>;
}

export function AdminTableHeaderCell({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

export function AdminTableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50/70">{children}</tr>;
}

export function AdminTableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-b border-slate-100 px-5 py-4 text-sm text-slate-700 ${className}`.trim()}>{children}</td>;
}
