import { useAISystemStatus, useAssessmentCounts, useAttentionAlerts, useUnreadMessageCount, useUnreadNotificationCount } from "../../hooks";
import type { NavBadgeKey } from "./navigation";

/** Counts shown next to sidebar items. Each comes from its own cached query. */
export function useNavBadges(): Record<NavBadgeKey, number> {
  const attention = useAttentionAlerts().data?.length ?? 0;
  const counts = useAssessmentCounts().data ?? [];
  const assessmentsDue = counts.filter((c) => c.status === "DUE" || c.status === "OVERDUE").reduce((s, c) => s + c.count, 0);
  const aiReview = useAISystemStatus().data?.queuedAnalyses ?? 0;
  const messages = useUnreadMessageCount();
  const notifications = useUnreadNotificationCount();
  return { attention, assessmentsDue, aiReview, messages, notifications };
}
