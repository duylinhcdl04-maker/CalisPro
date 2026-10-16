import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, SearchX } from "lucide-react";
import { useAssessmentCounts, useAssessments, useDebouncedValue } from "../hooks";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Panel, SearchInput, Segmented, type SegmentOption } from "../components/ui";
import { AssessmentTable } from "../components/assessments/AssessmentTable";
import {
  ASSESSMENT_TABS,
  apiStatusForTab,
  countForTab,
  filterForTab,
  tabFromParam,
  type AssessmentTab,
} from "../components/assessments/assessmentUtils";

const EMPTY_COPY: Record<AssessmentTab, string> = {
  ALL: "Chưa có bài đánh giá nào được lên lịch.",
  UPCOMING: "Không có bài đánh giá sắp tới.",
  DUE: "Không có bài đánh giá nào đến hạn hoặc quá hạn.",
  NEEDS_REVIEW: "Bạn đã review hết các bài đánh giá.",
  COMPLETED: "Chưa có bài đánh giá hoàn thành.",
};

export default function CoachAssessmentsPage() {
  const [params, setParams] = useSearchParams();
  const tab = tabFromParam(params.get("status"));
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);

  const counts = useAssessmentCounts();
  const query = useAssessments({ status: apiStatusForTab(tab), search: debounced || undefined });
  const items = useMemo(() => filterForTab(query.data ?? [], tab), [query.data, tab]);

  const options: SegmentOption<AssessmentTab>[] = ASSESSMENT_TABS.map((t) => ({ value: t.value, label: t.label, count: countForTab(counts.data, t.value) }));

  function changeTab(next: AssessmentTab) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === "ALL") p.delete("status");
        else p.set("status", next);
        return p;
      },
      { replace: true }
    );
  }

  return (
    <div>
      <PageHeader
        title="Đánh giá thể lực"
        description="Theo dõi lịch đánh giá, review kết quả và đưa khuyến nghị cho từng học viên."
      />

      <div className="mb-4 flex animate-rise flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" style={{ animationDelay: "60ms" }}>
        <Segmented options={options} value={tab} onChange={changeTab} ariaLabel="Lọc theo trạng thái đánh giá" />
        <SearchInput value={search} onChange={setSearch} label="Tìm theo học viên hoặc bài đánh giá" placeholder="Tìm học viên, bài đánh giá..." className="w-full lg:w-72" />
      </div>

      <Panel className="animate-rise overflow-hidden" bodyClassName="p-0 sm:p-0" as="section">
        <h2 className="sr-only">Kết quả</h2>
        {query.isLoading ? (
          <ListSkeleton rows={7} className="p-5 sm:p-6" />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          debounced ? (
            <EmptyState icon={SearchX} title="Không tìm thấy kết quả" description={`Không có bài đánh giá nào khớp với "${debounced}".`} />
          ) : (
            <EmptyState icon={ClipboardList} title="Danh sách trống" description={EMPTY_COPY[tab]} />
          )
        ) : (
          <div aria-busy={query.isFetching} className={query.isFetching ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <AssessmentTable items={items} />
          </div>
        )}
      </Panel>
    </div>
  );
}
