import { fetchCostByDay, fetchRoutingBreakdown, fetchSummary } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import Panel from "@/components/ui/Panel";
import CostChart from "@/components/charts/CostChart";
import RoutingChart from "@/components/charts/RoutingChart";
import { formatCost, formatNumber } from "@/lib/utils";

export default async function CostPage() {
  let costByDay: any = {};
  let routing: any[] = [];
  let summary: any = null;

  try {
    [costByDay, routing, summary] = await Promise.all([
      fetchCostByDay(14),
      fetchRoutingBreakdown(),
      fetchSummary(),
    ]);
  } catch {}

  const totalCalls = summary?.total_calls ?? 0;
  const totalCost  = summary?.total_cost_usd ?? 0;
  const savings    = summary?.estimated_cache_savings_usd ?? 0;

  // Compute per-model stats
  const byModel: Record<string, { calls: number; cost: number }> = {};
  routing.forEach((r: any) => {
    const m = r.routed_to;
    if (!byModel[m]) byModel[m] = { calls: 0, cost: 0 };
    byModel[m].calls += r.calls;
    byModel[m].cost  += r.total_cost_usd;
  });

  const totalRoutedCalls = Object.values(byModel).reduce((s, v) => s + v.calls, 0);

  return (
    <div>
      <PageHeader
        title="Cost Analysis"
        subtitle="14-day spend breakdown, routing efficiency, and savings"
      />

      <div className="p-8 space-y-6">
        {/* Savings banner */}
        {savings > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 bg-surface-2 border border-jade/20 rounded-xl p-5">
              <p className="text-xs font-mono text-ink/40 mb-1 uppercase tracking-widest">Saved by Cache</p>
              <p className="font-mono text-2xl font-600 text-jade">{formatCost(savings)}</p>
            </div>
            <div className="col-span-1 bg-surface-2 border border-amber/15 rounded-xl p-5">
              <p className="text-xs font-mono text-ink/40 mb-1 uppercase tracking-widest">Actual Spend</p>
              <p className="font-mono text-2xl font-600 text-amber">{formatCost(totalCost)}</p>
            </div>
            <div className="col-span-1 bg-surface-2 border border-ink/10 rounded-xl p-5">
              <p className="text-xs font-mono text-ink/40 mb-1 uppercase tracking-widest">Total Calls</p>
              <p className="font-mono text-2xl font-600 text-white">{formatNumber(totalCalls)}</p>
            </div>
          </div>
        )}

        {/* Cost trend chart */}
        <Panel
          title="Cost Trend — Last 14 Days"
          subtitle="amber = USD spend · green = cache hit count · dashed = total volume"
        >
          <CostChart data={costByDay} />
        </Panel>

        {/* Model routing */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Panel title="Calls by Routed Model">
            <RoutingChart data={routing} />
          </Panel>

          <Panel title="Routing Efficiency">
            <div className="space-y-3">
              {Object.entries(byModel).map(([model, data]) => {
                const pct = totalRoutedCalls ? (data.calls / totalRoutedCalls) * 100 : 0;
                const color =
                  model === "cache" ? "bg-jade" :
                  model.includes("mini") ? "bg-sky" : "bg-amber";
                return (
                  <div key={model}>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-ink/70">{model}</span>
                      <span className="text-ink/50">{pct.toFixed(1)}% · {formatCost(data.cost)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} opacity-80 transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-ink/[0.06] text-xs font-mono text-ink/40 space-y-1">
              <p>→ Calls going to <span className="text-sky">gpt-4o-mini</span> or <span className="text-jade">cache</span> represent cost savings</p>
              <p>→ Aim for &gt;40% cache hit rate in production workloads</p>
            </div>
          </Panel>
        </div>

        {/* Full routing table */}
        <Panel title="Routing Detail Table" subtitle="requested model → routed model breakdown">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-ink/40 border-b border-ink/[0.06]">
                <th className="text-left pb-3 font-500">CLIENT REQUESTED</th>
                <th className="text-left pb-3 font-500">PRISM ROUTED TO</th>
                <th className="text-right pb-3 font-500">CALLS</th>
                <th className="text-right pb-3 font-500">TOTAL COST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.05]">
              {routing.map((r: any, i: number) => (
                <tr key={i} className="table-row-hover">
                  <td className="py-3 text-ink/60">{r.requested_model}</td>
                  <td className="py-3 text-white/80">{r.routed_to}</td>
                  <td className="py-3 text-right text-ink/60">{formatNumber(r.calls)}</td>
                  <td className="py-3 text-right text-amber">{formatCost(r.total_cost_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
