"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyData = { month: string; count: number };
type StatusData = { name: string; value: number };

type AdminDashboardChartsProps = {
  monthlyData: MonthlyData[];
  statusData: StatusData[];
};

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

export function AdminDashboardCharts({
  monthlyData,
  statusData,
}: AdminDashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="h-80 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Son 6 Aylık Rezervasyon Sayısı
        </h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="h-80 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Rezervasyon Durum Dağılımı
        </h2>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              label
            >
              {statusData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
