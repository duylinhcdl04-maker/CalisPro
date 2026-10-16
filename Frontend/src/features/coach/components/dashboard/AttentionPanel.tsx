import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  CalendarX,
  ChevronRight,
  CreditCard,
  HeartPulse,
  Moon,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import { Button3D, EmptyState, Panel, StatusBadge, StudentAvatar, TONE_TEXT } from "../ui";
import { ATTENTION_TYPE_LABEL } from "../../constants/labels";
import { formatRelative } from "../../lib/format";
import type { AttentionAlert, AttentionType, Severity } from "../../types";

type IconType = ComponentType<{ size?: number; className?: string }>;

const TYPE_ICON: Record<AttentionType, IconType> = {
  INACTIVE: Moon,
  PERFORMANCE_DROP: TrendingDown,
  FORM_DROP: BadgeAlert,
  ASSESSMENT_OVERDUE: CalendarX,
  SUBSCRIPTION: CreditCard,
  INJURY: HeartPulse,
  LOW_ADHERENCE: AlertTriangle,
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Nghiêm trọng",
  warning: "Cảnh báo",
  info: "Theo dõi",
  success: "Ổn định",
};

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2, success: 3 };

const RAIL: Record<Severity, string> = {
  critical: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  success: "bg-emerald-500",
};

function MetricChange({ metric, severity }: { metric: NonNullable<AttentionAlert["metric"]>; severity: Severity }) {
  const unit = metric.unit ?? "";
  return (
    <span className="well-3d inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums" aria-label={`Từ ${metric.from}${unit} xuống ${metric.to}${unit}`}>
      <span className="text-text-secondary">
        {metric.from}
        {unit}
      </span>
      <ArrowRight size={12} className="text-text-secondary" aria-hidden />
      <span className={TONE_TEXT[severity]}>
        {metric.to}
        {unit}
      </span>
    </span>
  );
}

function AttentionRow({ alert, index }: { alert: AttentionAlert; index: number }) {
  const Icon = TYPE_ICON[alert.type];
  return (
    <li className="animate-rise" style={{ animationDelay: `${120 + index * 60}ms` }}>
      <Link
        to={`/coach/students/${alert.studentId}`}
        className="group relative flex items-center gap-3 overflow-hidden rounded-[16px] border border-border/70 bg-surface-elevated/60 py-3 pl-4 pr-3 transition-colors hover:border-accent/40 hover:bg-accent-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-4"
      >
        <span className={cn("absolute inset-y-0 left-0 w-1", RAIL[alert.severity])} aria-hidden />
        <StudentAvatar name={alert.studentName} src={alert.studentAvatar} size="md" className="hidden min-[400px]:inline-flex" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-extrabold text-text-primary">{alert.studentName}</span>
            <StatusBadge tone={alert.severity} icon={alert.severity === "critical" ? <AlertOctagon size={11} aria-hidden /> : <Icon size={11} aria-hidden />}>
              {SEVERITY_LABEL[alert.severity]}
            </StatusBadge>
            <span className="text-[11px] font-semibold text-text-secondary">{ATTENTION_TYPE_LABEL[alert.type]}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-text-primary">{alert.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{alert.detail}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {alert.metric && <MetricChange metric={alert.metric} severity={alert.severity} />}
            <time dateTime={alert.createdAt} className="text-[11px] text-text-secondary">
              {formatRelative(alert.createdAt)}
            </time>
          </div>
        </div>
        <ChevronRight size={18} className="shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
      </Link>
    </li>
  );
}

export function AttentionPanel({ alerts }: { alerts: AttentionAlert[] }) {
  const sorted = [...alerts].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.createdAt.localeCompare(a.createdAt));
  const critical = alerts.filter((a) => a.severity === "critical").length;

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          Cần chú ý
          <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-black tabular-nums text-white" aria-label={`${alerts.length} cảnh báo`}>
            {alerts.length}
          </span>
        </span>
      }
      description={critical > 0 ? `${critical} trường hợp nghiêm trọng, ưu tiên xử lý trước` : "Học viên cần bạn can thiệp sớm"}
      icon={AlertTriangle}
      actions={
        <Link to="/coach/students?needsAttention=true" className="rounded-lg text-xs font-bold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent dark:text-accent">
          Xem danh sách
        </Link>
      }
      className="border-rose-500/20 dark:border-rose-400/15"
    >
      {sorted.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Không có học viên cần chú ý" description="Tất cả học viên đang tập đều đặn. Tiếp tục theo dõi tiến độ trong danh sách học viên."
          action={<Button3D asChild size="sm"><Link to="/coach/students">Xem học viên</Link></Button3D>}
        />
      ) : (
        <ul className="space-y-2.5" aria-label="Danh sách cảnh báo">
          {sorted.map((alert, i) => (
            <AttentionRow key={alert.id} alert={alert} index={i} />
          ))}
        </ul>
      )}
    </Panel>
  );
}
