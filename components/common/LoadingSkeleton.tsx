import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 5, className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
      ))}
      <span className="sr-only">Loading content</span>
    </div>
  );
}

export function TableSkeleton({ rows = 5, className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-label="Loading table"
    >
      <div className="h-9 animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
      ))}
      <span className="sr-only">Loading table</span>
    </div>
  );
}
