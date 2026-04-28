"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import { ModelBadge, CacheBadge } from "@/components/ui/Badge";
import { cn, formatCost, formatMs } from "@/lib/utils";
import { SendHorizontal, Bot, User, Trash2, ChevronDown } from "lucide-react";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
  meta?: {
    cache_hit: boolean;
    routed_model: string;
    cost_usd: number;
    latency_ms: number;
  };
}

const MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "qwen/qwen3-32b",
  "meta-llama/llama-4-scout-17b-16e-instruct", "openai/gpt-oss-120b", "openai/gpt-oss-20b",
  "openai/gpt-oss-safeguard-20b"
];

const EXAMPLES = [
  "What is RAG (Retrieval Augmented Generation)?",
  "Summarize the benefits of semantic caching in 3 bullet points.",
  "Design a multi-agent workflow for document Q&A. Be detailed.",
  "What is the difference between fine-tuning and RAG?",
  "Translate this to German: Hello, how are you today?",
];

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(content?: string) {
    const text = content ?? input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const payload = updated.map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(payload, model);
      const reply = res.choices?.[0]?.message?.content ?? "";
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: reply,
          meta: {
            cache_hit: res.cache_hit,
            routed_model: res.routed_model ?? res.model,
            cost_usd: res.cost_usd ?? 0,
            latency_ms: res.latency_ms ?? 0,
          },
        },
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Playground"
        subtitle="Send requests through Prism and see routing + cache in real time"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="appearance-none bg-surface-3 border border-ink/15 text-white text-xs font-mono rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-amber/40"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/50 pointer-events-none" />
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-ink/50 hover:text-rose border border-ink/10 hover:border-rose/30 rounded-lg transition-colors font-mono"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
        }
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
              <Bot size={24} className="text-amber" />
            </div>
            <h2 className="font-display font-600 text-white text-lg mb-2">Test the Gateway</h2>
            <p className="text-sm text-ink/50 mb-8 max-w-sm">
              Every message goes through Prism — watch it route to the cheapest model and return cache metadata.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="text-left text-xs font-mono px-4 py-2.5 bg-surface-2 hover:bg-surface-3 border border-ink/10 hover:border-amber/25 rounded-lg text-ink/70 hover:text-white transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3 animate-slide-up", msg.role === "user" ? "flex-row-reverse" : "")}>
            <div className={cn(
              "w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center",
              msg.role === "user" ? "bg-amber/15 border border-amber/25" : "bg-surface-3 border border-ink/15"
            )}>
              {msg.role === "user" ? <User size={13} className="text-amber" /> : <Bot size={13} className="text-ink/70" />}
            </div>

            <div className={cn("flex flex-col gap-1.5 max-w-2xl", msg.role === "user" ? "items-end" : "")}>
              <div className={cn(
                "px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-amber/10 border border-amber/20 text-white/90"
                  : "bg-surface-2 border border-ink/10 text-white/80"
              )}>
                {msg.content}
              </div>

              {msg.meta && (
                <div className="flex items-center gap-2 flex-wrap">
                  <CacheBadge hit={msg.meta.cache_hit} />
                  <ModelBadge model={msg.meta.routed_model} />
                  <span className="text-[10px] font-mono text-ink/40">
                    {formatMs(msg.meta.latency_ms)} · {formatCost(msg.meta.cost_usd)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center bg-surface-3 border border-ink/15">
              <Bot size={13} className="text-ink/70" />
            </div>
            <div className="px-4 py-3 rounded-xl bg-surface-2 border border-ink/10">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-amber/60 animate-pulse2"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-rose/10 border border-rose/25 rounded-xl text-xs font-mono text-rose">
            Error: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-8 pb-6 pt-3 border-t border-ink/[0.07] bg-surface/80 backdrop-blur-sm">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none bg-surface-2 border border-ink/15 focus:border-amber/40 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-ink/30 focus:outline-none font-body transition-colors"
            style={{ minHeight: "46px", maxHeight: "140px" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 140) + "px";
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl bg-amber hover:bg-amber-glow disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
          >
            <SendHorizontal size={16} className="text-surface" />
          </button>
        </div>
      </div>
    </div>
  );
}
