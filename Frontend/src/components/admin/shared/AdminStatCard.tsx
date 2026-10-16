import {
  Users,
  Activity,
  Dumbbell,
  CheckCircle2,
  CreditCard,
  Bot,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { AdminKPI } from "../../../services/mock/adminMockData";

interface AdminStatCardProps {
  kpi: AdminKPI;
}

export function AdminStatCard({ kpi }: AdminStatCardProps) {
  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    Users,
    Activity,
    Dumbbell,
    CheckCircle2,
    CreditCard,
    Bot,
  };

  const Icon = iconMap[kpi.iconName] || Activity;

  return (
    <div className="group rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated hover:border-border transition-all space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          {kpi.label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-strong group-hover:scale-105 transition-transform shadow-2xs">
          <Icon size={18} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
          {kpi.value}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`flex items-center gap-0.5 font-bold ${
              kpi.trend === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : kpi.trend === "down"
                ? "text-rose-600 dark:text-rose-400"
                : "text-text-secondary"
            }`}
          >
            {kpi.trend === "up" ? (
              <TrendingUp size={13} />
            ) : kpi.trend === "down" ? (
              <TrendingDown size={13} />
            ) : (
              <Minus size={13} />
            )}
            {kpi.change}
          </span>
          <span className="text-text-secondary text-[11px] truncate">{kpi.comparisonPeriod}</span>
        </div>
      </div>
    </div>
  );
}
