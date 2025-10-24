"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SalesChartProps {
  data: Array<{
    name: string;
    revenue: number;
    photos: number;
  }>;
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis
            dataKey="name"
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
          <Bar dataKey="revenue" fill="#18181b" name="Umsatz (€)" />
          <Bar dataKey="photos" fill="#3b82f6" name="Fotos verkauft" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


