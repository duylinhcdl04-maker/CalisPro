import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { Severity } from "../../types";
import { TONE_CLASSES, TONE_TEXT } from "./StatusBadge";

interface KpiCardProps {
  label: string;
  value: number | string;
  description?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  status?: Severity;
  trend?: { direction: "up" | "down" | "flat"; value: string; label: string; /** true when "down" is good */ invert?: boolean } | null;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SEVERITY_TONE = { success: "success", warning: "warning", critical: "critical", info: "info" } as const;

/** Large-number KPI tile. Links to the list it summarises (every metric leads to an action). */
export function KpiCard({ label, value, description, icon: Icon, status = "info", trend, href, className, style }: KpiCardProps) {
  const tone = SEVERITY_TONE[status];
  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendGood = trend ? (trend.invert ? trend.direction === "down" : trend.direction === "up") : false;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("icon-tile-3d h-11 w-11 border", TONE_CLASSES[tone])}>
          <Icon size={20} />
        </span>
        {href && <ArrowUpRight size={18} className="text-text-secondary/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />}
      </div>
      <div className="mt-5">
        <div className="text-4xl font-black tabular-nums leading-none tracking-tight text-text-primary">{value}</div>
        <div className="mt-2 text-sm font-bold text-text-primary">{label}</div>
        {description && <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">{description}</p>}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-border/70 pt-3 text-xs">
          <span className={cn("inline-flex items-center gap-0.5 font-bold", trend.direction === "flat" ? TONE_TEXT.neutral : trendGood ? TONE_TEXT.success : TONE_TEXT.critical)}>
            <TrendIcon size={13} aria-hidden />
            {trend.value}
          </span>
          <span className="truncate text-text-secondary">{trend.label}</span>
        </div>
      )}
    </>
  );

  const classes = cn("panel-3d group block p-5 animate-rise", href && "panel-3d-interactive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", className);
  return href ? (
    <Link to={href} className={classes} style={style}>
      {body}
    </Link>
  ) : (
    <div className={classes} style={style}>
      {body}
    </div>
  );
}
