import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, NotebookPen } from "lucide-react";
import { Button3D, ErrorState, PageHeader, Panel } from "../components/ui";
import { useCoachDashboard } from "../hooks";
import { formatDate, greeting } from "../lib/format";
import { DashboardKpis } from "../components/dashboard/DashboardKpis";
import { AttentionPanel } from "../components/dashboard/AttentionPanel";
import { RecentSessionsPanel } from "../components/dashboard/RecentSessionsPanel";
import { TodaySchedulePanel } from "../components/dashboard/TodaySchedulePanel";
import { AchievementsPanel } from "../components/dashboard/AchievementsPanel";
import { AddNoteModal } from "../components/dashboard/AddNoteModal";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";

/** Vietnamese names put the given name last ("Hoàng Việt" -> "Việt"). */
function firstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

export default function CoachDashboardPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useCoachDashboard();
  const [noteOpen, setNoteOpen] = useState(false);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <Panel>
        <ErrorState title="Không thể tải tổng quan huấn luyện." onRetry={() => void refetch()} retrying={isRefetching} />
      </Panel>
    );
  }

  const today = new Date().toISOString();
  const stagger = (i: number) => ({ animationDelay: `${i * 60}ms` });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, Coach ${firstName(data.coachName)}`}
        description="Đây là tổng quan huấn luyện hôm nay."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-bold capitalize text-text-secondary">
            <CalendarDays size={13} aria-hidden />
            <time dateTime={today}>{formatDate(today, "EEEE, dd/MM/yyyy")}</time>
          </span>
        }
        actions={
          <>
            <Button3D asChild variant="secondary">
              <Link to="/coach/calendar">
                <CalendarDays size={16} aria-hidden />
                Xem lịch
              </Link>
            </Button3D>
            <Button3D variant="primary" leftIcon={<NotebookPen size={16} aria-hidden />} onClick={() => setNoteOpen(true)}>
              Thêm ghi chú
            </Button3D>
          </>
        }
      />

      <DashboardKpis kpis={data.kpis} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="animate-rise" style={stagger(4)}>
            <AttentionPanel alerts={data.attention} />
          </div>
          <div className="animate-rise" style={stagger(5)}>
            <RecentSessionsPanel sessions={data.recentSessions} />
          </div>
        </div>
        <div className="min-w-0 space-y-6">
          <div className="animate-rise" style={stagger(5)}>
            <TodaySchedulePanel events={data.todaySchedule} />
          </div>
          <div className="animate-rise" style={stagger(6)}>
            <AchievementsPanel achievements={data.achievements} />
          </div>
        </div>
      </div>

      <AddNoteModal open={noteOpen} onOpenChange={setNoteOpen} />
    </div>
  );
}
