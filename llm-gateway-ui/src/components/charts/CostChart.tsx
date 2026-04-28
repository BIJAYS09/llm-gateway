"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CostChartProps {
  data: Record<string, { calls: number; cost_usd: number; cache_hits: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-3 border border-ink/15 rounded-lg p-3 text-xs font-mono shadow-xl">
      <p className="text-ink/60 mb-2">{label}</p>
      <p className="text-amber">cost: ${payload[0]?.value?.toFixed(6)}</p>
      <p className="text-jade">cache hits: {payload[1]?.value}</p>
      <p className="text-ink/70">total calls: {payload[2]?.value}</p>
    </div>
  );
};

export default function CostChart({ data }: CostChartProps) {
  const chartData = Object.entries(data).map(([date, d]) => ({
    date: date.slice(5),   // "MM-DD"
    cost: d.cost_usd,
    cache_hits: d.cache_hits,
    calls: d.calls,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cacheGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v.toFixed(4)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="cost"       stroke="#f59e0b" strokeWidth={1.5} fill="url(#costGrad)" />
        <Area type="monotone" dataKey="cache_hits" stroke="#10b981" strokeWidth={1.5} fill="url(#cacheGrad)" />
        <Area type="monotone" dataKey="calls"      stroke="#475569" strokeWidth={1}   fill="none" strokeDasharray="3 3" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
