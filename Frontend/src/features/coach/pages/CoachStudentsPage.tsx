import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FilterX, ClipboardPlus, Users, UserSearch } from "lucide-react";
import { Button3D, EmptyState, ErrorState, PageHeader, Pagination, Panel, StatusBadge } from "../components/ui";
import { useStudents } from "../hooks";
import { useStudentListState } from "../components/students/list/useStudentListState";
import { useColumnVisibility } from "../components/students/list/columns";
import { StudentFilterBar } from "../components/students/list/StudentFilterBar";
import { ColumnMenu } from "../components/students/list/ColumnMenu";
import { StudentTable } from "../components/students/list/StudentTable";
import { StudentCardList } from "../components/students/list/StudentCardList";
import { StudentListSkeleton } from "../components/students/list/StudentListSkeleton";
import { BulkActionBar } from "../components/students/list/BulkActionBar";
import { MobileSortSelect } from "../components/students/list/MobileSortSelect";

export default function CoachStudentsPage() {
  const list = useStudentListState();
  const { params, setPage } = list;
  const columns = useColumnVisibility();
  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch, isRefetching } = useStudents(params);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // A stale ?page beyond the last page (e.g. after filtering) snaps back to the last one.
  useEffect(() => {
    if (data && data.totalPages > 0 && (params.page ?? 1) > data.totalPages) setPage(data.totalPages);
  }, [data, params.page, setPage]);

  const pageItems = data?.items ?? [];

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      const all = pageItems.every((s) => next.has(s.id));
      pageItems.forEach((s) => (all ? next.delete(s.id) : next.add(s.id)));
      return next;
    });

  const sendReminder = () => {
    toast.success("Đã gửi nhắc nhở", { description: `${selected.size} học viên sẽ nhận thông báo nhắc lịch tập.` });
    setSelected(new Set());
  };

  const hasFilters = list.activeFilterCount > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Học viên"
        description="Theo dõi, lọc và hành động nhanh với toàn bộ học viên được phân công."
        meta={
          data ? (
            <StatusBadge tone="accent" size="md" icon={<Users size={13} aria-hidden />}>
              <span className="tabular-nums">{data.total}</span>&nbsp;{hasFilters ? "kết quả phù hợp" : "học viên"}
            </StatusBadge>
          ) : null
        }
        actions={
          <Button3D asChild variant="primary">
            <Link to="/coach/plans/new">
              <ClipboardPlus size={16} aria-hidden />
              Tạo giáo án
            </Link>
          </Button3D>
        }
      />

      <Panel className="animate-rise" bodyClassName="space-y-4" as="section">
        <h2 className="sr-only">Bộ lọc học viên</h2>
        <StudentFilterBar
          params={params}
          searchInput={list.searchInput}
          onSearchChange={list.setSearchInput}
          onFilterChange={list.setFilter}
          onClear={list.clearFilters}
          activeCount={list.activeFilterCount}
          trailing={<ColumnMenu isVisible={columns.isVisible} onToggle={columns.toggle} onReset={columns.reset} />}
        />
        <MobileSortSelect sortBy={params.sortBy} sortDir={params.sortDir} onChange={list.setSort} />
      </Panel>

      <BulkActionBar count={selected.size} onRemind={sendReminder} onClear={() => setSelected(new Set())} />

      <section className="panel-3d animate-rise overflow-hidden" style={{ animationDelay: "60ms" }} aria-labelledby="student-list-heading" aria-busy={isFetching}>
        <h2 id="student-list-heading" className="sr-only">
          Danh sách học viên
        </h2>
        {isLoading ? (
          <div className="p-4 md:p-0">
            <StudentListSkeleton />
          </div>
        ) : isError ? (
          <ErrorState title="Không thể tải danh sách học viên." onRetry={() => void refetch()} retrying={isRefetching} />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={UserSearch}
            title="Không tìm thấy học viên"
            description={hasFilters ? "Không có học viên nào khớp với bộ lọc hiện tại. Thử nới lỏng hoặc xoá bộ lọc." : "Bạn chưa được phân công học viên nào."}
            action={
              hasFilters ? (
                <Button3D size="sm" leftIcon={<FilterX size={14} aria-hidden />} onClick={list.clearFilters}>
                  Xoá bộ lọc
                </Button3D>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <StudentTable
                students={pageItems}
                isVisible={columns.isVisible}
                sort={{ sortBy: params.sortBy, sortDir: params.sortDir }}
                onSort={list.toggleSort}
                selected={selected}
                onToggleSelect={toggleSelect}
                onToggleAll={toggleAll}
                dimmed={isPlaceholderData}
              />
            </div>
            <div className="p-3 md:hidden">
              <StudentCardList students={pageItems} selected={selected} onToggleSelect={toggleSelect} dimmed={isPlaceholderData} />
            </div>
            {data && (
              <div className="border-t border-border/70 px-4 py-3 sm:px-5">
                <Pagination page={data.page} totalPages={Math.max(1, data.totalPages)} total={data.total} pageSize={data.pageSize} onChange={list.setPage} />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
