import { Link } from "react-router-dom";
import { ChevronLeft, UserX } from "lucide-react";
import { Button3D, EmptyState, ErrorState, Panel, Skeleton } from "../../ui";

/** Mirrors the hero header, tab bar and overview grid so the page does not jump when data arrives. */
export function StudentDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải hồ sơ học viên">
      <Skeleton className="h-4 w-36" />
      <div className="panel-3d space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[74px] w-full rounded-[14px]" />
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-xl rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 w-full rounded-[22px]" />
        <Skeleton className="h-80 w-full rounded-[22px] lg:col-span-2" />
      </div>
    </div>
  );
}

function BackButton() {
  return (
    <Button3D asChild variant="primary" size="sm">
      <Link to="/coach/students">
        <ChevronLeft size={14} aria-hidden />
        Về danh sách học viên
      </Link>
    </Button3D>
  );
}

export function StudentNotFound() {
  return (
    <Panel className="animate-rise">
      <EmptyState
        icon={UserX}
        title="Không tìm thấy học viên"
        description="Học viên này không tồn tại hoặc không còn nằm trong danh sách bạn phụ trách."
        action={<BackButton />}
      />
    </Panel>
  );
}

export function StudentLoadError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <Panel className="animate-rise">
      <ErrorState title="Không thể tải hồ sơ học viên." onRetry={onRetry} retrying={retrying} />
      <div className="flex justify-center pb-4">
        <BackButton />
      </div>
    </Panel>
  );
}
