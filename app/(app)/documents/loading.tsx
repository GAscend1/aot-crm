import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="space-y-1">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-16 rounded-xl" />

      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}