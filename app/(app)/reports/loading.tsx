import { PageLayout } from "@/components/common/PageLayout";

export default function Loading() {
  return (
    <PageLayout title="Reports">
      <div className="space-y-1">
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-80 animate-pulse rounded bg-muted/70" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>

      <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />

      <div className="h-96 w-full animate-pulse rounded-xl bg-muted/70" />
    </PageLayout>
  );
}
