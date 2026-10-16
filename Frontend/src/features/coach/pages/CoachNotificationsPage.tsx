import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isToday, isYesterday } from "date-fns";
import { BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import type { CoachNotification, CoachNotificationType } from "../types";
import { NOTIFICATION_TYPE_LABEL } from "../constants/labels";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../hooks";
import { Button3D, EmptyState, ErrorState, ListSkeleton, PageHeader, Panel, Segmented, Toggle, type SegmentOption } from "../components/ui";
import { NotificationItem } from "../components/notifications/NotificationItem";

type TypeFilter = "ALL" | CoachNotificationType;

const TYPE_ORDER: CoachNotificationType[] = ["STUDENT", "ASSESSMENT", "WORKOUT", "AI", "ACHIEVEMENT", "SYSTEM"];
const TYPE_OPTIONS: SegmentOption<TypeFilter>[] = [{ value: "ALL", label: "Tất cả" }, ...TYPE_ORDER.map((t) => ({ value: t, label: NOTIFICATION_TYPE_LABEL[t] }))];

function groupNotifications(list: CoachNotification[]) {
  const groups = [
    { key: "today", label: "Hôm nay", items: [] as CoachNotification[] },
    { key: "yesterday", label: "Hôm qua", items: [] as CoachNotification[] },
    { key: "earlier", label: "Trước đó", items: [] as CoachNotification[] },
  ];
  for (const n of list) {
    const d = new Date(n.createdAt);
    groups[isToday(d) ? 0 : isYesterday(d) ? 1 : 2].items.push(n);
  }
  return groups.filter((g) => g.items.length > 0);
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Đã có lỗi xảy ra.");

export default function CoachNotificationsPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<TypeFilter>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = useNotifications({ type: type === "ALL" ? undefined : type, unreadOnly: unreadOnly || undefined });
  const all = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const groups = useMemo(() => groupNotifications(query.data ?? []), [query.data]);
  const unreadTotal = all.data?.filter((n) => !n.read).length ?? 0;

  function open(n: CoachNotification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.href) navigate(n.href);
  }

  function markOne(n: CoachNotification) {
    markRead.mutate(n.id, {
      onSuccess: () => toast.success("Đã đánh dấu đã đọc."),
      onError: (e) => toast.error(errMsg(e)),
    });
  }

  function markEverything() {
    markAll.mutate(undefined, {
      onSuccess: (r) => toast.success(r.updated > 0 ? `Đã đánh dấu ${r.updated} thông báo là đã đọc.` : "Không còn thông báo chưa đọc."),
      onError: (e) => toast.error(errMsg(e)),
    });
  }

  return (
    <div>
      <PageHeader
        title="Thông báo"
        description={unreadTotal > 0 ? `Bạn có ${unreadTotal} thông báo chưa đọc.` : "Cập nhật về học viên, đánh giá, buổi tập và AI."}
        actions={
          <Button3D variant="secondary" onClick={markEverything} loading={markAll.isPending} disabled={unreadTotal === 0} leftIcon={<CheckCheck size={16} />}>
            Đánh dấu tất cả đã đọc
          </Button3D>
        }
      />

      <Panel className="animate-rise" bodyClassName="p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 border-b border-border/70 px-1 pb-4 md:flex-row md:items-center md:justify-between">
          <Segmented options={TYPE_OPTIONS} value={type} onChange={setType} ariaLabel="Lọc theo loại thông báo" size="sm" />
          <div className="flex items-center gap-2.5">
            <Toggle checked={unreadOnly} onChange={setUnreadOnly} label="Chỉ chưa đọc" />
            <span className="text-xs font-bold text-text-secondary" aria-hidden>
              Chỉ chưa đọc
            </span>
          </div>
        </div>

        {query.isLoading ? (
          <ListSkeleton rows={6} className="p-3" />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} retrying={query.isRefetching} />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Bạn đã xem hết thông báo"
            description={type !== "ALL" || unreadOnly ? "Không có thông báo nào khớp bộ lọc hiện tại." : "Thông báo mới sẽ xuất hiện tại đây."}
          />
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.key} aria-labelledby={`ntf-${g.key}`}>
                <h2 id={`ntf-${g.key}`} className="mb-1.5 px-2 text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                  {g.label}
                </h2>
                <ul className="space-y-1.5">
                  {g.items.map((n, i) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      index={i}
                      onOpen={open}
                      onMarkRead={markOne}
                      marking={markRead.isPending && markRead.variables === n.id}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
