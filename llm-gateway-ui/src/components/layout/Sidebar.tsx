"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Clock,
  TrendingUp,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/",           label: "Overview",   icon: LayoutDashboard },
  { href: "/playground", label: "Playground", icon: MessageSquare },
  { href: "/calls",      label: "Calls",      icon: Clock },
  { href: "/cost",       label: "Cost",       icon: TrendingUp },
  { href: "/settings",   label: "Settings",   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-surface-1 border-r border-ink/[0.07] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-ink/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 flex-shrink-0">
            <div className="absolute inset-0 bg-amber rounded-md opacity-20 animate-pulse2" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap size={15} className="text-amber fill-amber" />
            </div>
          </div>
          <span className="font-display font-700 text-white text-lg tracking-tight">
            Prism
          </span>
        </div>
        <p className="text-[10px] text-ink/50 font-mono mt-1.5 ml-9 -mt-0.5">
          LLM Gateway v1.0
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-amber/10 text-amber-glow border border-amber/20 shadow-amber-sm"
                  : "text-ink/60 hover:text-ink hover:bg-surface-3"
              )}
            >
              <Icon size={16} className={active ? "text-amber" : ""} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-ink/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-jade animate-pulse2" />
          <span className="text-[11px] text-ink/40 font-mono">backend :8000</span>
        </div>
      </div>
    </aside>
  );
}
