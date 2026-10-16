import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ClipboardList, ClipboardPlus, LineChart } from "lucide-react";
import { formatDate } from "../../../lib/format";
import type { StudentDetail } from "../../../types";
import { ProgressLineChart } from "../../charts/ProgressLineChart";
import { Button3D, Delta, EmptyState, Panel, ScoreBar } from "../../ui";

export function CurrentPlanCard({ student: s }: { student: StudentDetail }) {
  const plan = s.currentPlan;
  return (
    <Panel
      title="Giáo án hiện tại"
      icon={ClipboardList}
      className="h-full"
      actions={
        plan ? (
          <Button3D asChild variant="ghost" size="sm">
            <Link to={`/coach/plans/${plan.planId}`}>
              Xem giáo án
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </Button3D>
        ) : undefined
      }
    >
      {plan ? (
        <div className="space-y-5">
          <div>
            <p className="text-base font-extrabold leading-snug text-text-primary">{plan.planName}</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Tuần <span className="font-bold tabular-nums text-text-primary">{plan.currentWeek}</span> / <span className="tabular-nums">{plan.totalWeeks}</span>
            </p>
          </div>
          <ScoreBar label="Tiến độ giáo án" value={plan.progressPercent} tone="accent" />
          <dl className="grid grid-cols-2 gap-3">
            <div className="well-3d rounded-[14px] px-3.5 py-3">
              <dt className="text-[11px] font-bold text-text-secondary">Buổi đã hoàn thành</dt>
              <dd className="mt-0.5 text-xl font-black tabular-nums text-text-primary">
                {plan.sessionsCompleted}
                <span className="text-sm font-semibold text-text-secondary">/{plan.sessionsPlanned}</span>
              </dd>
            </div>
            <div className="well-3d rounded-[14px] px-3.5 py-3">
              <dt className="text-[11px] font-bold text-text-secondary">Tuân thủ</dt>
              <dd className="mt-0.5 text-xl font-black tabular-nums text-text-primary">{plan.adherence}%</dd>
            </div>
          </dl>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Chưa có giáo án"
          description="Học viên chưa được gán giáo án nào. Tạo giáo án phù hợp với mục tiêu và trình độ hiện tại."
          action={
            <Button3D asChild variant="primary" size="sm">
              <Link to={`/coach/plans/new?studentId=${s.id}`}>
                <ClipboardPlus size={14} aria-hidden />
                Tạo giáo án
              </Link>
            </Button3D>
          }
        />
      )}
    </Panel>
  );
}

export function RecentPerformanceCard({ student: s }: { student: StudentDetail }) {
  const points = useMemo(() => s.fitnessHistory.slice(-12), [s.fitnessHistory]);
  const data = useMemo(() => points.map((p) => ({ label: formatDate(p.date, "dd/MM"), overall: p.overall })), [points]);
  const change = points.length > 1 ? points[points.length - 1].overall - points[0].overall : 0;

  return (
    <Panel
      title="Hiệu suất gần đây"
      description="Fitness score tổng thể, 12 tuần gần nhất"
      icon={LineChart}
      className="h-full"
      actions={
        points.length > 1 ? (
          <span className="text-right text-[11px] text-text-secondary">
            <Delta value={change} className="text-sm" /> <span className="sr-only">điểm</span>
            <span className="block">so với 12 tuần trước</span>
          </span>
        ) : undefined
      }
    >
      {data.length === 0 ? (
        <EmptyState icon={LineChart} title="Chưa có dữ liệu hiệu suất" description="Dữ liệu sẽ xuất hiện sau buổi đánh giá đầu tiên." />
      ) : (
        <div role="img" aria-label={`Biểu đồ fitness score tổng thể 12 tuần, thay đổi ${change} điểm`}>
          <ProgressLineChart data={data} series={[{ key: "overall", label: "Tổng thể" }]} area height={230} yDomain={["auto", "auto"]} />
        </div>
      )}
    </Panel>
  );
}
