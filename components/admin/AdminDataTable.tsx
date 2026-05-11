import type { ReactNode } from "react";

export function AdminDataTable({ children, minWidthClass = "min-w-[960px]" }: { children: ReactNode; minWidthClass?: string }) {
  return (
    <div className="hidden w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm lg:block">
      <div className="overflow-x-auto">
        <table className={`w-full text-[14px] ${minWidthClass}`}>{children}</table>
      </div>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-[#F1F5F9] bg-[#F8FAFC]">{children}</thead>;
}

export function AdminTableHeaderCell({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={`h-14 px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#64748B] ${align === "right" ? "text-right" : "text-left"} ${className}`.trim()}
    >
      {children}
    </th>
  );
}

export function AdminTableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="h-14 min-h-[56px] border-b border-[#F1F5F9] transition-colors duration-100 hover:bg-[#F8FAFC]">{children}</tr>
  );
}

export function AdminTableCell({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`h-14 min-h-[56px] border-b border-[#F1F5F9] px-5 py-3 align-middle text-[14px] text-[#1E293B] ${className}`.trim()}
    >
      {children}
    </td>
  );
}
