import { ListPanelSkeleton, PageHeaderSkeleton, StatGridSkeleton } from "@/components/loading-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Skeleton className="h-20 w-20" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-3/4 max-w-xl" />
          </div>
        </div>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
        <StatGridSkeleton count={4} />
      </section>
      <div className="mt-8">
        <PageHeaderSkeleton />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ListPanelSkeleton rows={3} />
          <ListPanelSkeleton rows={3} />
        </div>
      </div>
    </main>
  );
}
