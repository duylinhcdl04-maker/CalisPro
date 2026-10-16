import { TrendingDown, TrendingUp } from "lucide-react";
import { JourneyCard } from "../../features/assessment-v2/journey";
import { LevelPendingBanner } from "../../features/level/LevelPendingBanner";
import { useAssessmentSnapshotsQuery } from "../../features/progress/hooks";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import type { AssessmentSnapshotMetrics } from "../../types";
import { cn } from "../../lib/utils";

const METRIC_LABELS: Record<keyof AssessmentSnapshotMetrics, string> = {
  strength: "Sức mạnh",
  endurance: "Sức bền",
  mobility: "Linh hoạt",
  core: "Cốt lõi",
};

const METRIC_ORDER: (keyof AssessmentSnapshotMetrics)[] = ["strength", "endurance", "mobility", "core"];

export default function AssessmentHistoryPage() {
  const { data: snapshots, isLoading, isError, refetch } = useAssessmentSnapshotsQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-10">
      <JourneyCard />
      <LevelPendingBanner />
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Lịch sử đánh giá</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Theo dõi các lần đánh giá thể lực và mức độ cải thiện theo thời gian.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : isError ? (
        <Card className="py-10 text-center">
          <p className="text-sm text-text-secondary">Không tải được lịch sử đánh giá. Vui lòng thử lại.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : !snapshots || snapshots.length === 0 ? (
        <Card className="py-10 text-center text-sm text-text-secondary">
          Bạn chưa có lần đánh giá nào. Hoàn thành đánh giá đầu tiên để bắt đầu theo dõi.
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {snapshots.map((snapshot, index) => (
              <Card key={snapshot.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">{snapshot.label}</div>
                  <div className="text-xs text-text-secondary">{snapshot.dateLabel}</div>
                </div>
                <Badge variant={index === snapshots.length - 1 ? "accent" : "neutral"}>
                  {index === snapshots.length - 1 ? "Gần nhất" : "Đã hoàn thành"}
                </Badge>
              </Card>
            ))}
          </div>

          {snapshots.length >= 2 ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-text-primary">So sánh trước / sau</h2>
              <Card className="space-y-4">
                {METRIC_ORDER.map((key) => {
                  const first = snapshots[0].metrics[key];
                  const last = snapshots[snapshots.length - 1].metrics[key];
                  const change = first === 0 ? 0 : Math.round(((last - first) / first) * 100);
                  const isUp = change >= 0;

                  return (
                    <div key={key} className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{METRIC_LABELS[key]}</div>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {METRIC_LABELS[key]} {isUp ? "+" : ""}
                          {change}% so với đánh giá ban đầu.
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex shrink-0 items-center gap-1 text-sm font-semibold",
                          isUp ? "text-success" : "text-danger"
                        )}
                      >
                        {isUp ? <TrendingUp size={16} aria-hidden="true" /> : <TrendingDown size={16} aria-hidden="true" />}
                        <span>
                          {isUp ? "+" : ""}
                          {change}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              Hoàn thành thêm các buổi tập để mở khóa lần đánh giá định kỳ tiếp theo.
            </p>
          )}
        </>
      )}
    </div>
  );
}
