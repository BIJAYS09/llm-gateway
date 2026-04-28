"use client";

import { useState, useEffect } from "react";
import { fetchRecent } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import Panel from "@/components/ui/Panel";
import { ModelBadge, CacheBadge } from "@/components/ui/Badge";
import { formatCost, formatMs, formatNumber } from "@/lib/utils";
import { RefreshCw, Filter } from "lucide-react";

type Call = {
  id: number;
  request_id: string;
  requested_model: string;
  routed_model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  cache_hit: boolean;
  created_at: string;
};

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "cache" | "miss">("all");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await fetchRecent(100);
      setCalls(data);
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = calls.filter((c) => {
    if (filter === "cache") return c.cache_hit;
    if (filter === "miss")  return !c.cache_hit;
    return true;
  });

  const totalCost = calls.reduce((s, c) => s + c.cost_usd, 0);
  const avgLatency = calls.length ? calls.reduce((s, c) => s + c.latency_ms, 0) / calls.length : 0;

  return (
    <div>
      <PageHeader
        title="Recent Calls"
        subtitle="Last 100 requests through the gateway"
        action={
          <button
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-ink/60 hover:text-white border border-ink/10 hover:border-ink/25 rounded-lg transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      <div className="p-8 space-y-5">
        {/* Summary bar */}
        <div className="flex gap-4 text-xs font-mono text-ink/50">
          <span>{formatNumber(calls.length)} calls · </span>
          <span className="text-jade">{calls.filter((c) => c.cache_hit).length} cache hits</span>
          <span>·</span>
          <span className="text-amber">{formatCost(totalCost)} total cost</span>
          <span>·</span>
          <span>{formatMs(avgLatency)} avg latency</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {(["all", "cache", "miss"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                filter === f
                  ? "bg-amber/10 border-amber/25 text-amber"
                  : "border-ink/10 text-ink/50 hover:text-ink hover:border-ink/20"
              }`}
            >
              {f === "all" ? `All (${calls.length})` : f === "cache" ? `Cache hits (${calls.filter(c=>c.cache_hit).length})` : `Cache misses (${calls.filter(c=>!c.cache_hit).length})`}
            </button>
          ))}
        </div>

        <Panel>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-surface-3 rounded-lg animate-pulse2" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-ink/40 font-mono text-sm py-8">No calls recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-ink/40 border-b border-ink/[0.06]">
                    <th className="text-left pb-3 font-500">TIME</th>
                    <th className="text-left pb-3 font-500">CACHE</th>
                    <th className="text-left pb-3 font-500">REQUESTED</th>
                    <th className="text-left pb-3 font-500">ROUTED TO</th>
                    <th className="text-right pb-3 font-500">TOKENS</th>
                    <th className="text-right pb-3 font-500">LATENCY</th>
                    <th className="text-right pb-3 font-500">COST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.05]">
                  {filtered.map((call) => (
                    <tr key={call.id} className="table-row-hover">
                      <td className="py-3 text-ink/40 whitespace-nowrap">
                        {new Date(call.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="py-3">
                        <CacheBadge hit={call.cache_hit} />
                      </td>
                      <td className="py-3 text-ink/60">{call.requested_model}</td>
                      <td className="py-3">
                        <ModelBadge model={call.routed_model} />
                      </td>
                      <td className="py-3 text-right text-ink/60">{formatNumber(call.total_tokens)}</td>
                      <td className="py-3 text-right text-ink/70">{formatMs(call.latency_ms)}</td>
                      <td className={`py-3 text-right ${call.cache_hit ? "text-jade" : "text-amber"}`}>
                        {call.cache_hit ? "$0.000000" : formatCost(call.cost_usd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
