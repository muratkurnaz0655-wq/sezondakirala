"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyRevenueData = { month: string; revenue: number };
type DailyReservationData = { day: string; count: number };

type AdminDashboardChartsProps = {
  monthlyRevenueData: MonthlyRevenueData[];
  dailyReservationData: DailyReservationData[];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function AdminDashboardCharts({
  monthlyRevenueData,
  dailyReservationData,
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
      <section className="h-80 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Son 30 Gün Rezervasyon Sayısı
        </h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyReservationData}>
            <XAxis dataKey="day" minTickGap={18} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" name="Rezervasyon" stroke="#22c55e" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
