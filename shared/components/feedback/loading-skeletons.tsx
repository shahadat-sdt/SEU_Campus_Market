import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <section className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-3/4 max-w-lg" />
      </div>
      {action && <Skeleton className="h-10 w-32" />}
    </section>
  );
}

export function StatGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="pt-5">
            <Skeleton className="mb-3 h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-9 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FormSkeleton({ sections = 4 }: { sections?: number }) {
  return (
    <div className="grid gap-5">
      {Array.from({ length: sections }).map((_, index) => (
        <section key={index} className="rounded-md border bg-card p-4">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full sm:col-span-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </section>
      ))}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}

export function ListPanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Skeleton className="h-4 w-56 max-w-full" />
              <Skeleton className="h-3 w-40 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DetailPageSkeleton() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-5">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3]" />
          ))}
        </div>
        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-5">
        <ListPanelSkeleton rows={2} />
        <ListPanelSkeleton rows={3} />
      </aside>
    </main>
  );
}
