import type { ComponentType } from "react";
import { Bot, Check, ClipboardCheck, Dumbbell, Settings, Trophy, Users } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { CoachNotification, CoachNotificationType } from "../../types";
import { NOTIFICATION_TYPE_LABEL } from "../../constants/labels";
import { formatRelative } from "../../lib/format";
import { Button3D, TONE_CLASSES, Tooltip } from "../ui";

export const NOTIFICATION_ICON: Record<CoachNotificationType, ComponentType<{ size?: number; className?: string }>> = {
  STUDENT: Users,
  ASSESSMENT: ClipboardCheck,
  WORKOUT: Dumbbell,
  AI: Bot,
  ACHIEVEMENT: Trophy,
  SYSTEM: Settings,
};

interface NotificationItemProps {
  notification: CoachNotification;
  onOpen: (n: CoachNotification) => void;
  onMarkRead: (n: CoachNotification) => void;
  marking: boolean;
  index: number;
}

export function NotificationItem({ notification: n, onOpen, onMarkRead, marking, index }: NotificationItemProps) {
  const Icon = NOTIFICATION_ICON[n.type];
  return (
    <li
      className={cn(
        "group relative flex items-start gap-3 rounded-[18px] border p-3 transition-colors animate-rise sm:gap-4 sm:p-4",
        n.read ? "border-transparent hover:bg-surface-elevated" : "border-accent/20 bg-accent-soft/40 hover:bg-accent-soft/60"
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <span className={cn("icon-tile-3d mt-0.5 h-10 w-10 shrink-0 border", TONE_CLASSES[n.severity])}>
        <Icon size={18} aria-hidden />
      </span>

      <button
        type="button"
        onClick={() => onOpen(n)}
        className="min-w-0 flex-1 rounded-[12px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={cn("text-sm text-text-primary", n.read ? "font-bold" : "font-extrabold")}>{n.title}</span>
          <span className="text-[11px] font-semibold text-text-secondary">{NOTIFICATION_TYPE_LABEL[n.type]}</span>
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">{n.message}</span>
        <time dateTime={n.createdAt} className="mt-1.5 block text-[11px] font-semibold text-text-secondary">
          {formatRelative(n.createdAt)}
        </time>
        {!n.read && <span className="sr-only">Chưa đọc</span>}
      </button>

      <div className="flex shrink-0 items-center gap-2 self-center">
        {!n.read && (
          <>
            <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
            <Tooltip label="Đánh dấu đã đọc" side="left">
              <Button3D variant="secondary" size="icon-sm" onClick={() => onMarkRead(n)} loading={marking} aria-label={`Đánh dấu đã đọc: ${n.title}`}>
                {!marking && <Check size={15} />}
              </Button3D>
            </Tooltip>
          </>
        )}
      </div>
    </li>
  );
}
