"use client";

import {
  Bar,
  BarChart,
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

export function AdminDashboardCharts({
  monthlyRevenueData,
  summary,
}: AdminDashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="h-80 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Son 6 Aylık Ciro
        </h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyRevenueData}>
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [`₺${currencyFormatter.format(Number(value))}`, "Ciro"]} />
            <Bar dataKey="revenue" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Bu Ay Durum Özeti</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Onaylandı: {summary.approved}</div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">Beklemede: {summary.pending}</div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">İptal: {summary.cancelled}</div>
        </div>
      </section>
    </div>
  );
}
