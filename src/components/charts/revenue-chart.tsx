"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    sales: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis
            dataKey="date"
            className="text-xs text-zinc-600 dark:text-zinc-400"
          />
          <YAxis className="text-xs text-zinc-600 dark:text-zinc-400" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#18181b" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#18181b"
            strokeWidth={2}
            name="Umsatz (€)"
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Verkäufe"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


