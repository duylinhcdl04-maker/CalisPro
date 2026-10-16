import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { Button3D } from "./Button3D";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-3d", className)} aria-hidden />;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <span className="icon-tile-3d well-3d mb-4 h-14 w-14 text-text-secondary">
        <Icon size={24} />
      </span>
      <p className="text-sm font-extrabold text-text-primary">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-text-secondary">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({ title = "Không thể tải dữ liệu.", description = "Kiểm tra kết nối rồi thử lại.", onRetry, retrying, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <span className="icon-tile-3d mb-4 h-14 w-14 border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <AlertTriangle size={24} />
      </span>
      <p className="text-sm font-extrabold text-text-primary">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-text-secondary">{description}</p>
      {onRetry && (
        <Button3D className="mt-5" size="sm" onClick={onRetry} loading={retrying} leftIcon={<RotateCw size={14} />}>
          Thử lại
        </Button3D>
      )}
    </div>
  );
}

/** Generic page-level loading layout: header + KPI row + two panels. */
export function PageSkeleton({ kpis = 4 }: { kpis?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {kpis > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: kpis }, (_, i) => (
            <div key={i} className="panel-3d space-y-4 p-5">
              <Skeleton className="h-11 w-11" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel-3d space-y-3 p-6 lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="panel-3d space-y-3 p-6">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
