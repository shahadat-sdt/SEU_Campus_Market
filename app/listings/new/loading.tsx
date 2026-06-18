import { FormSkeleton, PageHeaderSkeleton } from "@/components/loading-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent>
          <PageHeaderSkeleton />
          <FormSkeleton />
        </CardContent>
      </Card>
    </main>
  );
}
