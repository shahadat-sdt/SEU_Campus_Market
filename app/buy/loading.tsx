import { PageHeaderSkeleton, ProductGridSkeleton } from "@/shared/components/feedback/loading-skeletons";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <PageHeaderSkeleton />
      <div className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_160px_auto]">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex gap-2 overflow-hidden py-6">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 shrink-0" />
        ))}
      </div>
      <ProductGridSkeleton />
    </main>
  );
}
