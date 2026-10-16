import type { ComponentType } from "react";
import { AlertTriangle, ClipboardCheck, Users, Activity } from "lucide-react";
import { KpiCard } from "../ui";
import type { DashboardKpi, DashboardKpiKey } from "../../types";

const KPI_ICON: Record<DashboardKpiKey, ComponentType<{ size?: number; className?: string }>> = {
  TOTAL_STUDENTS: Users,
  ACTIVE_STUDENTS: Activity,
  NEEDS_ATTENTION: AlertTriangle,
  ASSESSMENTS_DUE: ClipboardCheck,
};

/** KPIs where a falling number is good news. */
const INVERTED: ReadonlySet<DashboardKpiKey> = new Set<DashboardKpiKey>(["NEEDS_ATTENTION", "ASSESSMENTS_DUE"]);

export function DashboardKpis({ kpis }: { kpis: DashboardKpi[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số tổng quan">
      {kpis.map((kpi, i) => (
        <li key={kpi.key} className="min-w-0">
          <KpiCard
            label={kpi.label}
            value={kpi.value}
            description={kpi.description}
            icon={KPI_ICON[kpi.key]}
            status={kpi.status}
            trend={kpi.trend ? { ...kpi.trend, invert: INVERTED.has(kpi.key) } : null}
            href={kpi.href}
            className="h-full"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        </li>
      ))}
    </ul>
  );
}
