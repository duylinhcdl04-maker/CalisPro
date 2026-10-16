import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { ChevronsUp, Flame, Medal, Trophy } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { EmptyState, Panel, TONE_CLASSES, TONE_TEXT } from "../ui";
import { ACHIEVEMENT_TYPE_LABEL, type Tone } from "../../constants/labels";
import { formatRelative } from "../../lib/format";
import type { Achievement, AchievementType } from "../../types";

const TYPE_META: Record<AchievementType, { icon: ComponentType<{ size?: number; className?: string }>; tone: Tone }> = {
  PR: { icon: Trophy, tone: "warning" },
  STREAK: { icon: Flame, tone: "critical" },
  LEVEL_UP: { icon: ChevronsUp, tone: "accent" },
  CHALLENGE: { icon: Medal, tone: "success" },
};

export function AchievementsPanel({ achievements }: { achievements: Achievement[] }) {
  return (
    <Panel title="Thành tích gần đây" description="Ghi nhận để động viên học viên" icon={Trophy}>
      {achievements.length === 0 ? (
        <EmptyState icon={Trophy} title="Chưa có thành tích mới" description="Kỷ lục, chuỗi tập và lên cấp của học viên sẽ hiển thị ở đây." className="py-8" />
      ) : (
        <ul className="space-y-1" aria-label="Thành tích gần đây">
          {achievements.map((a) => {
            const meta = TYPE_META[a.type];
            const Icon = meta.icon;
            return (
              <li key={a.id}>
                <Link
                  to={`/coach/students/${a.studentId}`}
                  className="flex items-start gap-3 rounded-[14px] p-2 transition-colors hover:bg-accent-soft/40 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className={cn("icon-tile-3d h-9 w-9 shrink-0 border", TONE_CLASSES[meta.tone])}>
                    <Icon size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-text-primary">
                      <span className="truncate">{a.studentName}</span>
                    </p>
                    <p className="text-xs text-text-secondary">
                      <span className={cn("font-bold", TONE_TEXT[meta.tone])}>{ACHIEVEMENT_TYPE_LABEL[a.type]}:</span> {a.title}
                    </p>
                    {a.detail && <p className="mt-0.5 line-clamp-1 text-[11px] text-text-secondary">{a.detail}</p>}
                  </div>
                  <time dateTime={a.achievedAt} className="shrink-0 pt-0.5 text-[11px] text-text-secondary">
                    {formatRelative(a.achievedAt)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
