import { useSearchParams } from "react-router-dom";
import { Dumbbell, SearchX } from "lucide-react";
import { useSessions } from "../hooks";
import type { ReviewStatus, SessionStatus } from "../types";
import { SESSION_STATUS } from "../constants/labels";
import { Button3D, EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination, Panel, SearchInput, Segmented, SelectField, type SegmentOption } from "../components/ui";
import { SessionCards, SessionTable } from "../components/sessions/SessionList";
import { useUrlSearch } from "../components/sessions/useUrlSearch";

type ReviewFilter = "all" | "pending" | "reviewed";

const REVIEW_OPTIONS: SegmentOption<ReviewFilter>[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ review" },
  { value: "reviewed", label: "Đã review" },
];
const REVIEW_PARAM: Record<ReviewFilter, ReviewStatus | undefined> = { all: undefined, pending: "PENDING", reviewed: "REVIEWED" };
const STATUS_KEYS = Object.keys(SESSION_STATUS) as SessionStatus[];
const PAGE_SIZE = 10;

function parseReview(v: string | null): ReviewFilter {
  return v === "pending" || v === "reviewed" ? v : "all";
}
function parseStatus(v: string | null): SessionStatus | undefined {
  return STATUS_KEYS.find((k) => k === v);
}

export default function CoachSessionsPage() {
  const [params, setParams] = useSearchParams();
  const review = parseReview(params.get("review"));
  const status = parseStatus(params.get("status"));
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = useUrlSearch(params, setParams);

  const query = useSessions({ search: search.value || undefined, status, reviewStatus: REVIEW_PARAM[review], page, pageSize: PAGE_SIZE });
  const data = query.data;
  const hasFilters = review !== "all" || !!status || !!search.value;

  function update(key: string, value: string | undefined) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  }

  function clearFilters() {
    search.setInput("");
    setParams(new URLSearchParams());
  }

  return (
    <div>
      <PageHeader title="Buổi tập" description="Theo dõi kết quả từng buổi tập của học viên, xem Form Score và gửi phản hồi sau khi review." />

      <Panel bodyClassName="p-0 sm:p-0" className="animate-rise">
        <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <Segmented ariaLabel="Lọc theo trạng thái review" options={REVIEW_OPTIONS} value={review} onChange={(v) => update("review", v === "all" ? undefined : v)} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <SelectField aria-label="Lọc theo trạng thái buổi tập" value={status ?? ""} onChange={(e) => update("status", e.target.value || undefined)} className="sm:w-44">
              <option value="">Mọi trạng thái</option>
              {STATUS_KEYS.map((k) => (
                <option key={k} value={k}>{SESSION_STATUS[k].label}</option>
              ))}
            </SelectField>
            <SearchInput label="Tìm theo học viên hoặc buổi tập" placeholder="Tìm học viên, buổi tập..." value={search.input} onChange={search.setInput} className="sm:w-64" />
          </div>
        </div>

        {query.isPending ? (
          <ListSkeleton rows={8} className="p-5" />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} retrying={query.isFetching} />
        ) : !data || data.items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="Không có buổi tập phù hợp."
              description="Thử đổi bộ lọc hoặc từ khoá tìm kiếm."
              action={<Button3D size="sm" onClick={clearFilters}>Xoá bộ lọc</Button3D>}
            />
          ) : (
            <EmptyState icon={Dumbbell} title="Chưa có buổi tập nào." description="Khi học viên hoàn thành buổi tập, kết quả sẽ hiển thị tại đây." />
          )
        ) : (
          <div className={query.isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={query.isPlaceholderData || undefined}>
            <div className="hidden overflow-x-auto scrollbar-thin lg:block">
              <SessionTable items={data.items} />
            </div>
            <div className="p-4 lg:hidden">
              <SessionCards items={data.items} />
            </div>
            <div className="border-t border-border/70 px-4 py-3 sm:px-5">
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onChange={(p) => update("page", p > 1 ? String(p) : undefined)} />
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
