import { PageHeaderSkeleton, StatGridSkeleton } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-6xl content-center gap-8 px-4 py-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <PageHeaderSkeleton action />
        <StatGridSkeleton count={2} />
      </section>
    </main>
  );
}
