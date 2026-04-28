import { cn } from "@/lib/utils";

interface PanelProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleAction?: React.ReactNode;
}

export default function Panel({ title, subtitle, children, className, titleAction }: PanelProps) {
  return (
    <div className={cn("bg-surface-2 border border-ink/[0.08] rounded-xl overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/[0.07]">
          <div>
            <h2 className="text-sm font-display font-600 text-white/90">{title}</h2>
            {subtitle && <p className="text-xs text-ink/40 mt-0.5 font-mono">{subtitle}</p>}
          </div>
          {titleAction && <div>{titleAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
