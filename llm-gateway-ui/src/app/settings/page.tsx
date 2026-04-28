import PageHeader from "@/components/layout/PageHeader";
import Panel from "@/components/ui/Panel";
import { Settings, Info } from "lucide-react";

const ENV_VARS = [
  { key: "OPENAI_API_KEY",                    default: "sk-...",             desc: "Your OpenAI API key" },
  { key: "REDIS_URL",                         default: "redis://localhost:6379", desc: "Redis connection string" },
  { key: "DATABASE_URL",                      default: "sqlite:///./prism.db", desc: "SQLite or Postgres URL" },
  { key: "CACHE_SIMILARITY_THRESHOLD",        default: "0.92",               desc: "Cosine similarity cutoff for cache hits. Lower = more hits, less precision." },
  { key: "CHEAP_MODEL",                       default: "gpt-4o-mini",        desc: "Model used for simple/short queries" },
  { key: "SMART_MODEL",                       default: "gpt-4o",             desc: "Model used for complex/long queries" },
  { key: "CHEAP_MODEL_PRICE_PER_1K_INPUT",    default: "0.00015",            desc: "Input token price for cheap model (per 1k tokens)" },
  { key: "CHEAP_MODEL_PRICE_PER_1K_OUTPUT",   default: "0.0006",             desc: "Output token price for cheap model" },
  { key: "SMART_MODEL_PRICE_PER_1K_INPUT",    default: "0.0025",             desc: "Input token price for smart model" },
  { key: "SMART_MODEL_PRICE_PER_1K_OUTPUT",   default: "0.01",               desc: "Output token price for smart model" },
];

const ENDPOINTS = [
  { method: "POST", path: "/v1/chat/completions", desc: "Main proxy endpoint — OpenAI-compatible" },
  { method: "GET",  path: "/metrics/summary",      desc: "Overall cost, cache hit rate, model breakdown" },
  { method: "GET",  path: "/metrics/recent",        desc: "Last N calls with full metadata" },
  { method: "GET",  path: "/metrics/cost-by-day",   desc: "Daily cost breakdown for last N days" },
  { method: "GET",  path: "/metrics/routing-breakdown", desc: "Requested vs routed model stats" },
  { method: "GET",  path: "/health",               desc: "Health check" },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configuration reference for the Prism backend"
      />

      <div className="p-8 space-y-6">
        {/* Quick connect snippet */}
        <Panel title="Connect your client" subtitle="Drop-in replacement — change one line">
          <div className="space-y-3">
            <p className="text-xs text-ink/50 font-mono">Python (OpenAI SDK)</p>
            <pre className="bg-surface-3 border border-ink/10 rounded-xl p-4 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">
{`from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="unused",  # Prism manages this
)

response = client.chat.completions.create(
    model="gpt-4o",            # Prism will route as needed
    messages=[{"role": "user", "content": "What is RAG?"}],
)

# Extra fields in response:
print(response.cache_hit)      # True / False
print(response.routed_model)   # "gpt-4o-mini" (saved $!)
print(response.cost_usd)       # 0.00003750
print(response.latency_ms)     # 412.0`}
            </pre>

            <p className="text-xs text-ink/50 font-mono mt-4">LangChain</p>
            <pre className="bg-surface-3 border border-ink/10 rounded-xl p-4 text-xs font-mono text-white/80 overflow-x-auto">
{`from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="http://localhost:8000/v1",
    model="gpt-4o",
)`}
            </pre>
          </div>
        </Panel>

        {/* Environment variables */}
        <Panel title="Environment Variables" subtitle="Set these in your .env file">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-ink/40 border-b border-ink/[0.06]">
                  <th className="text-left pb-3 font-500">VARIABLE</th>
                  <th className="text-left pb-3 font-500">DEFAULT</th>
                  <th className="text-left pb-3 font-500">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.05]">
                {ENV_VARS.map((v) => (
                  <tr key={v.key} className="table-row-hover">
                    <td className="py-3 text-amber pr-4 whitespace-nowrap">{v.key}</td>
                    <td className="py-3 text-jade pr-4 whitespace-nowrap">{v.default}</td>
                    <td className="py-3 text-ink/50">{v.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* API reference */}
        <Panel title="API Endpoints">
          <div className="space-y-2">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="flex items-start gap-3 py-2.5 border-b border-ink/[0.05] last:border-0">
                <span className={`badge flex-shrink-0 mt-0.5 ${ep.method === "POST" ? "bg-amber/10 text-amber border border-amber/20" : "bg-jade/10 text-jade border border-jade/20"}`}>
                  {ep.method}
                </span>
                <div>
                  <p className="font-mono text-xs text-white/80">{ep.path}</p>
                  <p className="text-xs text-ink/40 mt-0.5">{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Threshold guide */}
        <Panel title="Cache Threshold Guide" subtitle="CACHE_SIMILARITY_THRESHOLD">
          <div className="space-y-3 text-xs font-mono">
            {[
              { val: "0.85", label: "Aggressive", color: "text-rose", note: "More cache hits. Risk of wrong answers for subtly different questions." },
              { val: "0.92", label: "Recommended ✓", color: "text-jade", note: "Balanced. Catches rephrased identical questions without false positives." },
              { val: "0.95", label: "Conservative", color: "text-sky", note: "Very precise. Lower cache hit rate but near-zero risk of stale answers." },
              { val: "0.99", label: "Exact-ish", color: "text-ink/40", note: "Almost never caches. Effectively disabled." },
            ].map((t) => (
              <div key={t.val} className="flex gap-4 items-start py-2 border-b border-ink/[0.05] last:border-0">
                <span className={`w-10 flex-shrink-0 ${t.color} font-600`}>{t.val}</span>
                <span className={`w-28 flex-shrink-0 ${t.color}`}>{t.label}</span>
                <span className="text-ink/50">{t.note}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
