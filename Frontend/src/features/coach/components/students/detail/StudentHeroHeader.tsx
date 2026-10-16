import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarCheck, ChevronLeft, ClipboardPlus, Flame, MessageSquare, NotebookPen, Target } from "lucide-react";
import { GOAL_LABEL, LEVEL_LABEL, STUDENT_STATUS } from "../../../constants/labels";
import { formatDate, formatRelative } from "../../../lib/format";
import type { StudentDetail } from "../../../types";
import { Button3D, Panel, ScoreRing, StatusBadge, StudentAvatar } from "../../ui";

interface StudentHeroHeaderProps {
  student: StudentDetail;
  onAddNote: () => void;
}

function QuickStat({ icon: Icon, label, value, hint }: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: ReactNode; hint?: string }) {
  return (
    <li className="well-3d flex min-w-0 items-center gap-3 rounded-[14px] px-3.5 py-3">
      <span className="icon-tile-3d h-9 w-9 shrink-0 bg-accent-soft text-accent-strong dark:text-accent">
        <Icon size={17} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-text-secondary">{label}</p>
        <p className="truncate text-lg font-black tabular-nums leading-tight text-text-primary">{value}</p>
        {hint && <p className="truncate text-[11px] text-text-secondary">{hint}</p>}
      </div>
    </li>
  );
}

export function StudentHeroHeader({ student: s, onAddNote }: StudentHeroHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        to="/coach/students"
        className="inline-flex animate-rise items-center gap-1 rounded-lg text-xs font-bold text-text-secondary transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ChevronLeft size={15} aria-hidden />
        Danh sách học viên
      </Link>

      <Panel className="animate-rise" bodyClassName="space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <StudentAvatar name={s.name} src={s.avatarUrl} size="xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-[28px]">{s.name}</h1>
                <StatusBadge status={STUDENT_STATUS[s.status]} size="md" />
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                <span className="font-bold tabular-nums text-text-primary">{s.code}</span>
                <span aria-hidden> · </span>
                {s.email}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone="accent" size="md">{LEVEL_LABEL[s.level]}</StatusBadge>
                <StatusBadge tone="neutral" size="md" icon={<Target size={12} aria-hidden />}>
                  {GOAL_LABEL[s.goal]}
                </StatusBadge>
                <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                  <CalendarCheck size={13} aria-hidden />
                  Tham gia {formatDate(s.joinedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 lg:justify-end">
            <Button3D asChild variant="secondary">
              <Link to={`/coach/messages?studentId=${s.id}`}>
                <MessageSquare size={15} aria-hidden />
                Nhắn tin
              </Link>
            </Button3D>
            <Button3D variant="secondary" onClick={onAddNote} leftIcon={<NotebookPen size={15} aria-hidden />}>
              Thêm ghi chú
            </Button3D>
            <Button3D asChild variant="primary">
              <Link to={`/coach/plans/new?studentId=${s.id}`}>
                <ClipboardPlus size={15} aria-hidden />
                Tạo giáo án
              </Link>
            </Button3D>
          </div>
        </div>

        <ul aria-label="Chỉ số nhanh" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <li className="well-3d flex items-center gap-3 rounded-[14px] px-3.5 py-2.5">
            <ScoreRing value={s.fitnessScore} size={56} stroke={6} label="Fitness score" />
            <div>
              <p className="text-[11px] font-bold text-text-secondary">Fitness score</p>
              <p className="text-lg font-black tabular-nums leading-tight text-text-primary">
                {s.fitnessScore}
                <span className="text-xs font-semibold text-text-secondary">/100</span>
              </p>
            </div>
          </li>
          <QuickStat icon={Flame} label="Chuỗi tập" value={`${s.streak} ngày`} />
          <QuickStat icon={Target} label="Tuân thủ (4 tuần)" value={`${s.adherence}%`} hint={`${s.trainingFrequency.toFixed(1)} buổi/tuần`} />
          <QuickStat icon={CalendarCheck} label="Buổi tập gần nhất" value={formatRelative(s.lastWorkoutAt)} />
        </ul>

        {s.limitations.length > 0 && (
          <div role="note" aria-label="Lưu ý chấn thương và hạn chế" className="flex gap-3 rounded-[14px] border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-amber-800 dark:text-amber-200">Lưu ý chấn thương / hạn chế</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-amber-800/90 dark:text-amber-100/90">
                {s.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
