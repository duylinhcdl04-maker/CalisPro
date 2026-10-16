import { Check, Lightbulb, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";
import { useUpdateRecommendation } from "../../hooks";
import type { AIRecommendation, RecommendationStatus } from "../../types";
import { Button3D, EmptyState, Panel, StatusBadge } from "../ui";
import { RECOMMENDATION_STATUS } from "./labels";

const SUCCESS_TEXT: Record<RecommendationStatus, string> = {
  ACCEPTED: "Đã chấp nhận khuyến nghị.",
  DISMISSED: "Đã bỏ qua khuyến nghị.",
  PENDING: "Đã hoàn tác quyết định.",
};

function RecommendationItem({ analysisId, rec }: { analysisId: string; rec: AIRecommendation }) {
  const mutation = useUpdateRecommendation();
  const pendingStatus = mutation.isPending ? mutation.variables?.status : undefined;

  function set(status: RecommendationStatus) {
    mutation.mutate(
      { analysisId, recommendationId: rec.id, status },
      { onSuccess: () => toast.success(SUCCESS_TEXT[status]), onError: () => toast.error("Không cập nhật được khuyến nghị.") }
    );
  }

  return (
    <li className={cn("well-3d rounded-2xl p-4 transition-opacity", rec.status === "DISMISSED" && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-sm font-bold leading-relaxed text-text-primary", rec.status === "DISMISSED" && "line-through decoration-text-secondary/60")}>{rec.text}</p>
        <StatusBadge status={RECOMMENDATION_STATUS[rec.status]} icon={rec.status === "ACCEPTED" ? <Check size={11} aria-hidden /> : undefined} />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
        <span className="font-bold">Lý do: </span>
        {rec.rationale}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {rec.status === "PENDING" ? (
          <>
            <Button3D size="sm" variant="success" onClick={() => set("ACCEPTED")} loading={pendingStatus === "ACCEPTED"} disabled={mutation.isPending} leftIcon={<Check size={14} />}>
              Chấp nhận
            </Button3D>
            <Button3D size="sm" variant="secondary" onClick={() => set("DISMISSED")} loading={pendingStatus === "DISMISSED"} disabled={mutation.isPending} leftIcon={<X size={14} />}>
              Bỏ qua
            </Button3D>
          </>
        ) : (
          <Button3D size="sm" variant="ghost" onClick={() => set("PENDING")} loading={mutation.isPending} leftIcon={<Undo2 size={14} />}>
            Hoàn tác
          </Button3D>
        )}
      </div>
    </li>
  );
}

export function RecommendationsPanel({ analysisId, recommendations }: { analysisId: string; recommendations: AIRecommendation[] }) {
  return (
    <Panel title="Khuyến nghị từ AI" description="Chấp nhận hoặc bỏ qua từng khuyến nghị. Quyết định của bạn được lưu lại." icon={Lightbulb}>
      {recommendations.length ? (
        <ul className="space-y-3">
          {recommendations.map((r) => (
            <RecommendationItem key={r.id} analysisId={analysisId} rec={r} />
          ))}
        </ul>
      ) : (
        <EmptyState className="py-6" title="Không có khuyến nghị." description="AI không phát hiện điểm cần điều chỉnh trong buổi tập này." />
      )}
    </Panel>
  );
}
