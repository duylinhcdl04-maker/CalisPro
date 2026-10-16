import { Skeleton } from "../ui";

function PanelSkeleton({ rows, rowClass }: { rows: number; rowClass: string }) {
  return (
    <div className="panel-3d space-y-3 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={rowClass} />
      ))}
    </div>
  );
}

/** Mirrors the dashboard layout: header, 4 KPIs, 2/3 + 1/3 columns. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải tổng quan">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2.5">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="panel-3d space-y-4 p-5">
            <Skeleton className="h-11 w-11" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelSkeleton rows={4} rowClass="h-24 w-full" />
          <PanelSkeleton rows={5} rowClass="h-10 w-full" />
        </div>
        <div className="space-y-6">
          <PanelSkeleton rows={3} rowClass="h-20 w-full" />
          <PanelSkeleton rows={4} rowClass="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
