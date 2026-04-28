import { Suspense } from "react";
import { fetchSummary, fetchCostByDay, fetchRoutingBreakdown } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Panel from "@/components/ui/Panel";
import CostChart from "@/components/charts/CostChart";
import RoutingChart from "@/components/charts/RoutingChart";
import { formatCost, formatNumber } from "@/lib/utils";
import {
  DollarSign,
  Layers,
  Zap,
  Clock,
  TrendingDown,
  Activity,
} from "lucide-react";

async function OverviewContent() {
  let summary: any = null;
  let costByDay: any = {};
  let routing: any[] = [];
  let error = false;

  try {
    [summary, costByDay, routing] = await Promise.all([
      fetchSummary(),
      fetchCostByDay(7),
      fetchRoutingBreakdown(),
    ]);
  } catch {
    error = true;
  }

  if (error || !summary || summary.message) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
          <Activity size={24} className="text-amber" />
        </div>
        <h2 className="font-display font-600 text-white text-lg mb-2">No data yet</h2>
        <p className="text-sm text-ink/50 max-w-xs">
          {error
            ? "Cannot reach the backend. Make sure Prism is running on port 8000."
            : "Make some requests to /v1/chat/completions and metrics will appear here."}
        </p>
        <div className="mt-4 px-4 py-2 bg-surface-3 border border-ink/15 rounded-lg">
          <code className="text-xs font-mono text-amber">
            docker-compose up --build
          </code>
        </div>
      </div>
    );
  }

  const byModel = summary.by_model ?? {};

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Calls"
          value={formatNumber(summary.total_calls)}
          sub={`${summary.cache_misses} actual LLM calls`}
          icon={Layers}
          accent="amber"
          delay={0}
        />
        <StatCard
          label="Total Cost"
          value={formatCost(summary.total_cost_usd)}
          sub="across all models"
          icon={DollarSign}
          accent="rose"
          delay={60}
        />
        <StatCard
          label="Cache Hit Rate"
          value={summary.cache_hit_rate}
          sub={`${summary.cache_hits} hits saved`}
          icon={Zap}
          accent="jade"
          delay={120}
        />
        <StatCard
          label="Avg Latency"
          value={`${summary.avg_latency_ms?.toFixed(0)}ms`}
          sub="including cache hits"
          icon={Clock}
          accent="sky"
          delay={180}
        />
      </div>

      {/* Savings callout */}
      {summary.estimated_cache_savings_usd > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-jade/8 border border-jade/20 rounded-xl animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
          <TrendingDown size={18} className="text-jade flex-shrink-0" />
          <p className="text-sm text-jade/90 font-mono">
            Semantic cache saved an estimated{" "}
            <span className="text-jade font-600">
              {formatCost(summary.estimated_cache_savings_usd)}
            </span>{" "}
            by serving {summary.cache_hits} requests from cache
          </p>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          title="Cost & Cache — Last 7 Days"
          subtitle="amber = cost · green = cache hits · dashed = all calls"
          className="xl:col-span-2"
        >
          <CostChart data={costByDay} />
        </Panel>

        <Panel title="Calls by Routed Model" subtitle="actual model used after routing">
          <RoutingChart data={routing} />
        </Panel>
      </div>

      {/* Model breakdown table */}
      <Panel title="Model Breakdown">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-ink/40 border-b border-ink/[0.06]">
              <th className="text-left pb-3 font-500">MODEL</th>
              <th className="text-right pb-3 font-500">CALLS</th>
              <th className="text-right pb-3 font-500">TOTAL TOKENS</th>
              <th className="text-right pb-3 font-500">COST (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.05]">
            {Object.entries(byModel).map(([model, stats]: [string, any]) => (
              <tr key={model} className="table-row-hover">
                <td className="py-3 text-white/80">{model}</td>
                <td className="py-3 text-right text-ink/70">{formatNumber(stats.calls)}</td>
                <td className="py-3 text-right text-ink/70">{formatNumber(stats.total_tokens ?? 0)}</td>
                <td className="py-3 text-right text-amber">{formatCost(stats.cost_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Cost, cache, and routing metrics across all LLM calls"
      />
      <Suspense
        fallback={
          <div className="p-8 grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-2 rounded-xl border border-ink/[0.08] animate-pulse2" />
            ))}
          </div>
        }
      >
        <OverviewContent />
      </Suspense>
    </div>
  );
}
