import { useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";
import { useAIAnalyses, useAIOverview } from "../hooks";
import { ErrorState, PageHeader, PageSkeleton, Panel } from "../components/ui";
import { AIKpiRow, CommonErrorsPanel, FormScoreTrendPanel } from "../components/ai/AIOverviewSections";
import { AnalysisQueue, QUEUE_PARAM, type QueueFilter } from "../components/ai/AnalysisQueue";
import { AI_DISCLAIMER } from "../components/ai/labels";
import { useUrlSearch } from "../components/sessions/useUrlSearch";

function parseFilter(v: string | null): QueueFilter {
  return v === "reviewed" || v === "all" ? v : "pending";
}

export default function CoachAIAnalysisPage() {
  const [params, setParams] = useSearchParams();
  const filter = parseFilter(params.get("review"));
  const search = useUrlSearch(params, setParams);

  const overview = useAIOverview();
  const list = useAIAnalyses({ reviewStatus: QUEUE_PARAM[filter], search: search.value || undefined });

  function setFilter(f: QueueFilter) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (f === "pending") next.delete("review");
      else next.set("review", f);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Coaching & Motion"
        description="Kết quả phân tích chuyển động do hệ thống AI Motion tạo ra từ video buổi tập. Đây là gợi ý tham khảo, Coach là người đưa ra quyết định cuối cùng."
      />

      {overview.isPending ? (
        <PageSkeleton kpis={4} />
      ) : overview.isError ? (
        <Panel>
          <ErrorState title="Không tải được tổng quan AI." onRetry={() => overview.refetch()} retrying={overview.isFetching} />
        </Panel>
      ) : (
        <>
          <AIKpiRow overview={overview.data} />
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <FormScoreTrendPanel history={overview.data.formScoreHistory} />
            </div>
            <div className="lg:col-span-2">
              <CommonErrorsPanel errors={overview.data.commonErrors} />
            </div>
          </div>
        </>
      )}

      <AnalysisQueue
        filter={filter}
        onFilterChange={setFilter}
        search={search.input}
        onSearchChange={search.setInput}
        items={list.data}
        isPending={list.isPending}
        isError={list.isError}
        isFetching={list.isFetching}
        onRetry={() => list.refetch()}
      />

      <p className="flex items-start gap-2 text-xs text-text-secondary">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        {AI_DISCLAIMER}
      </p>
    </div>
  );
}
