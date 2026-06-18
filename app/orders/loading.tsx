import { ListPanelSkeleton, PageHeaderSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <ListPanelSkeleton rows={3} />
        <ListPanelSkeleton rows={3} />
      </div>
    </main>
  );
}
