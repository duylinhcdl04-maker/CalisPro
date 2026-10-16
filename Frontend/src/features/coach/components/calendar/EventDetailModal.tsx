import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, MapPin, NotebookText, Pencil, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { CalendarEvent } from "../../types";
import { EVENT_STATUS, EVENT_TYPE } from "../../constants/labels";
import { formatDate, formatTime } from "../../lib/format";
import { useCancelEvent } from "../../hooks";
import { Button3D, Modal, StatusBadge, StudentAvatar } from "../ui";

interface EventDetailModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (e: CalendarEvent) => void;
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm text-text-primary">
      <span className="mt-0.5 text-text-secondary" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function EventDetailModal({ event, onClose, onEdit }: EventDetailModalProps) {
  const [confirming, setConfirming] = useState(false);
  const cancel = useCancelEvent();

  useEffect(() => setConfirming(false), [event?.id]);

  if (!event) return null;

  const editable = event.status === "UPCOMING" || event.status === "IN_PROGRESS";

  function doCancel() {
    if (!event) return;
    cancel.mutate(event.id, {
      onSuccess: () => {
        toast.success("Đã huỷ lịch.", { description: event.title });
        onClose();
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không thể huỷ lịch."),
    });
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && !cancel.isPending && onClose()}
      title={event.title}
      description={EVENT_TYPE[event.type].label}
      footer={
        editable ? (
          confirming ? (
            <>
              <Button3D variant="ghost" onClick={() => setConfirming(false)} disabled={cancel.isPending}>
                Giữ lịch
              </Button3D>
              <Button3D variant="danger" onClick={doCancel} loading={cancel.isPending} leftIcon={<XCircle size={15} />}>
                Xác nhận huỷ
              </Button3D>
            </>
          ) : (
            <>
              <Button3D variant="ghost" className="text-rose-600 dark:text-rose-400" onClick={() => setConfirming(true)} leftIcon={<XCircle size={15} />}>
                Huỷ lịch
              </Button3D>
              <Button3D variant="primary" onClick={() => onEdit(event)} leftIcon={<Pencil size={15} />}>
                Chỉnh sửa
              </Button3D>
            </>
          )
        ) : (
          <Button3D onClick={onClose}>Đóng</Button3D>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={EVENT_TYPE[event.type]} />
          <StatusBadge status={EVENT_STATUS[event.status]} />
        </div>
        <Row icon={<CalendarClock size={16} />}>
          <p className="font-bold capitalize">{formatDate(event.start, "EEEE, dd/MM/yyyy")}</p>
          <p className="text-xs tabular-nums text-text-secondary">
            {formatTime(event.start)} - {formatTime(event.end)}
          </p>
        </Row>
        {event.location && <Row icon={<MapPin size={16} />}>{event.location}</Row>}
        {event.studentId && event.studentName && (
          <Link
            to={`/coach/students/${event.studentId}`}
            className="flex items-center gap-3 rounded-[14px] border border-border/70 bg-surface-elevated/60 p-3 transition-colors hover:border-accent/30 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <StudentAvatar name={event.studentName} src={event.studentAvatar} />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-text-secondary">Học viên</span>
              <span className="block truncate text-sm font-extrabold text-text-primary">{event.studentName}</span>
            </span>
          </Link>
        )}
        {event.notes && (
          <Row icon={<NotebookText size={16} />}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{event.notes}</p>
          </Row>
        )}
        {confirming && (
          <div role="alert" className="flex items-start gap-2.5 rounded-[14px] border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <AlertTriangle size={16} className="mt-px shrink-0" aria-hidden />
            Huỷ lịch này? Học viên sẽ nhận được thông báo và thao tác không thể hoàn tác.
          </div>
        )}
      </div>
    </Modal>
  );
}
