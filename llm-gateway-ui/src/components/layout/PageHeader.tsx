import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between px-8 pt-8 pb-6 border-b border-ink/[0.07]", className)}>
      <div>
        <h1 className="font-display font-700 text-white text-2xl tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-ink/50 mt-1 font-body">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}
