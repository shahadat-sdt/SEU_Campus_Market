import { ListPanelSkeleton, PageHeaderSkeleton, StatGridSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={5} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <ListPanelSkeleton rows={4} />
        <ListPanelSkeleton rows={4} />
      </div>
      <div className="mt-6">
        <ListPanelSkeleton rows={5} />
      </div>
    </main>
  );
}
