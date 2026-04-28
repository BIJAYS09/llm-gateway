import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: "amber" | "jade" | "rose" | "sky";
  delay?: number;
}

const accentMap = {
  amber: { icon: "text-amber", border: "border-amber/20", bg: "bg-amber/8", glow: "hover:shadow-amber" },
  jade:  { icon: "text-jade",  border: "border-jade/20",  bg: "bg-jade/8",  glow: "hover:shadow-jade"  },
  rose:  { icon: "text-rose",  border: "border-rose/20",  bg: "bg-rose/8",  glow: "hover:shadow-rose"  },
  sky:   { icon: "text-sky",   border: "border-sky/20",   bg: "bg-sky/8",   glow: "hover:shadow-none"  },
};

export default function StatCard({ label, value, sub, icon: Icon, accent = "amber", delay = 0 }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div
      className={cn(
        "stat-card bg-surface-2 border rounded-xl p-5 animate-slide-up",
        a.border,
        a.glow,
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-ink/50 font-mono uppercase tracking-widest">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", a.bg)}>
          <Icon size={16} className={a.icon} />
        </div>
      </div>
      <div className="font-mono font-600 text-white text-2xl tracking-tight">{value}</div>
      {sub && <div className="text-xs text-ink/40 mt-1 font-mono">{sub}</div>}
    </div>
  );
}
