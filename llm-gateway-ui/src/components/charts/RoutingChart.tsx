"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RoutingChartProps {
  data: {
    requested_model: string;
    routed_to: string;
    calls: number;
    total_cost_usd: number;
  }[];
}

const COLORS: Record<string, string> = {
  "gpt-4o-mini": "#38bdf8",
  "gpt-4o":      "#f59e0b",
  "cache":       "#10b981",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-3 border border-ink/15 rounded-lg p-3 text-xs font-mono shadow-xl">
      <p className="text-white mb-1">{label}</p>
      <p className="text-amber">calls: {payload[0]?.value}</p>
      {payload[1] && <p className="text-jade">cost: ${payload[1]?.value?.toFixed(6)}</p>}
    </div>
  );
};

export default function RoutingChart({ data }: RoutingChartProps) {
  const grouped = data.reduce((acc, row) => {
    const key = row.routed_to;
    if (!acc[key]) acc[key] = { model: key, calls: 0, cost: 0 };
    acc[key].calls += row.calls;
    acc[key].cost  += row.total_cost_usd;
    return acc;
  }, {} as Record<string, { model: string; calls: number; cost: number }>);

  const chartData = Object.values(grouped);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
        <XAxis
          dataKey="model"
          tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="calls" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.model] ?? "#475569"} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
