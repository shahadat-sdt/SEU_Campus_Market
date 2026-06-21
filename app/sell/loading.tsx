import { ListPanelSkeleton, PageHeaderSkeleton, StatGridSkeleton } from "@/shared/components/feedback/loading-skeletons";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <PageHeaderSkeleton action />
      <StatGridSkeleton count={3} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <ListPanelSkeleton rows={3} />
        <ListPanelSkeleton rows={4} />
      </div>
    </main>
  );
}
