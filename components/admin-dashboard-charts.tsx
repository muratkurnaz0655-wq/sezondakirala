"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyRevenueData = { month: string; revenue: number };
type MonthlySummary = { approved: number; pending: number; cancelled: number };

type AdminDashboardChartsProps = {
  monthlyRevenueData: MonthlyRevenueData[];
  summary: MonthlySummary;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatAxisTl(v: number) {
  if (v >= 1_000_000) return `₺${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `₺${Math.round(v / 1000)}K`;
  return `₺${v}`;
}

export function AdminDashboardCharts({
  monthlyRevenueData,
  summary,
}: AdminDashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="flex h-80 min-h-[20rem] flex-col rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#1E293B]">Son 6 Aylık Ciro</h2>
          <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Son 6 Ay
          </span>
        </div>
        <div className="min-h-0 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={monthlyRevenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis
                tickFormatter={formatAxisTl}
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value) => [`₺${currencyFormatter.format(Number(value))}`, "Ciro"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.08)",
                }}
              />
              <Bar dataKey="revenue" fill="#1D9E75" radius={[8, 8, 0, 0]} activeBar={{ fill: "#168a66" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[#1E293B]">Bu Ay Durum Özeti</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E2E8F0] border-l-4 border-l-[#1D9E75] bg-white px-5 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Onaylandı</p>
            <p className="mt-1 text-2xl font-semibold text-[#1E293B]">{summary.approved}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] border-l-4 border-l-[#F59E0B] bg-white px-5 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">Beklemede</p>
            <p className="mt-1 text-2xl font-semibold text-[#1E293B]">{summary.pending}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] border-l-4 border-l-[#EF4444] bg-white px-5 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">İptal</p>
            <p className="mt-1 text-2xl font-semibold text-[#1E293B]">{summary.cancelled}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
