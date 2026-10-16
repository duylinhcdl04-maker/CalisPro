import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus, SearchX } from "lucide-react";
import { Button3D, EmptyState, ErrorState, PageHeader, Panel, SearchInput, Segmented, Skeleton, type SegmentOption } from "../components/ui";
import { AssignStudentModal } from "../components/workouts/plans/AssignStudentModal";
import { PlanCard } from "../components/workouts/plans/PlanCard";
import { usePlanActions } from "../components/workouts/plans/usePlanActions";
import { ConfirmDialog } from "../components/workouts/ConfirmDialog";
import { useDebouncedValue, usePlans } from "../hooks";
import type { PlanStatus, WorkoutPlanSummary } from "../types";

type StatusFilter = "ALL" | PlanStatus;
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang áp dụng" },
  { value: "DRAFT", label: "Nháp" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Đang tải giáo án">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="panel-3d space-y-4 p-5">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      ))}
    </div>
  );
}

/** /coach/plans: every workout plan the coach owns, with management actions. */
export default function CoachPlansPage() {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 300);
  // One query per search term; status filtering and counts are derived locally so tabs switch instantly.
  const plans = usePlans({ search: debounced || undefined });
  const last = useRef<WorkoutPlanSummary[] | undefined>(undefined);
  if (plans.data) last.current = plans.data;
  const all = plans.data ?? last.current;
  const actions = usePlanActions();

  const visible = useMemo(() => (all ?? []).filter((p) => status === "ALL" || p.status === status), [all, status]);
  const options: SegmentOption<StatusFilter>[] = FILTERS.map((f) => ({
    ...f,
    count: all ? (f.value === "ALL" ? all.length : all.filter((p) => p.status === f.value).length) : undefined,
  }));
  const filtered = status !== "ALL" || debounced !== "";

  const createBtn = (
    <Button3D asChild variant="primary">
      <Link to="/coach/plans/new">
        <Plus size={16} aria-hidden />
        Tạo giáo án
      </Link>
    </Button3D>
  );

  return (
    <div>
      <PageHeader title="Giáo án" description="Thiết kế, gán và theo dõi giáo án tập luyện cho từng học viên." actions={createBtn} />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented ariaLabel="Lọc theo trạng thái" options={options} value={status} onChange={setStatus} />
        <SearchInput value={search} onChange={setSearch} label="Tìm giáo án" placeholder="Tìm theo tên giáo án hoặc học viên..." className="w-full md:w-80" />
      </div>

      {plans.isError && !all ? (
        <Panel>
          <ErrorState onRetry={() => plans.refetch()} retrying={plans.isFetching} />
        </Panel>
      ) : !all ? (
        <GridSkeleton />
      ) : visible.length === 0 ? (
        <Panel>
          {filtered ? (
            <EmptyState icon={SearchX} title="Không có giáo án phù hợp" description="Thử đổi bộ lọc trạng thái hoặc từ khoá tìm kiếm." />
          ) : (
            <EmptyState icon={ClipboardList} title="Chưa có giáo án nào" description="Tạo giáo án đầu tiên để xếp lịch tập theo tuần cho học viên." action={createBtn} />
          )}
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy={plans.isFetching || undefined}>
          {visible.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              busy={actions.busyId === p.id}
              onEdit={actions.onEdit}
              onDuplicate={actions.onDuplicate}
              onAssign={actions.assign.open}
              onPause={actions.onPause}
              onActivate={actions.onActivate}
              onArchive={actions.archive.open}
            />
          ))}
        </div>
      )}

      <AssignStudentModal plan={actions.assign.target} pending={actions.assign.pending} onClose={actions.assign.close} onConfirm={actions.assign.confirm} />
      <ConfirmDialog
        open={actions.archive.target !== null}
        title="Lưu trữ giáo án?"
        description={`"${actions.archive.target?.name ?? ""}" sẽ ngừng áp dụng và chuyển vào mục Lưu trữ. Bạn có thể kích hoạt lại sau.`}
        confirmLabel="Lưu trữ"
        loading={actions.archive.pending}
        onConfirm={actions.archive.confirm}
        onCancel={actions.archive.close}
      />
    </div>
  );
}
