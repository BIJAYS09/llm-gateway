import { cn } from "@/lib/utils";

type Variant = "amber" | "jade" | "rose" | "sky" | "neutral";

const variantMap: Record<Variant, string> = {
  amber:   "bg-amber/10 text-amber border border-amber/25",
  jade:    "bg-jade/10 text-jade border border-jade/25",
  rose:    "bg-rose/10 text-rose border border-rose/25",
  sky:     "bg-sky/10 text-sky border border-sky/25",
  neutral: "bg-ink/10 text-ink/70 border border-ink/15",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span className={cn("badge", variantMap[variant], className)}>
      {children}
    </span>
  );
}

export function ModelBadge({ model }: { model: string }) {
  if (model === "cache") return <Badge variant="jade">⚡ cached</Badge>;
  if (model.includes("mini")) return <Badge variant="sky">{model}</Badge>;
  if (model.includes("4o"))   return <Badge variant="amber">{model}</Badge>;
  return <Badge>{model}</Badge>;
}

export function CacheBadge({ hit }: { hit: boolean }) {
  return hit
    ? <Badge variant="jade">HIT</Badge>
    : <Badge variant="neutral">MISS</Badge>;
}
