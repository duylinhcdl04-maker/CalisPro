import { cn } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-border/70", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-6", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-6 w-40" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-6 h-48 w-full" />
    </div>
  );
}

export function WorkoutSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-7">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-8 w-56" />
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="mt-6 h-11 w-40 rounded-full" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
    </div>
  );
}
