import { Skeleton } from "../../ui";

/** Matches table rows on desktop and cards on mobile. */
export function StudentListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Đang tải danh sách học viên">
      <div className="hidden md:block">
        <div className="flex gap-6 border-b border-border/70 px-5 py-3.5">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/50 px-5 py-3 last:border-0">
            <Skeleton className="h-5 w-5 rounded-[6px]" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="w-40 space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-2.5 flex-1" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-[18px] border border-border/70 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
