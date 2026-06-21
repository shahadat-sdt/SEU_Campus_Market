import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

type MetricCardProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  compact?: boolean;
};

export function MetricCard({ icon: Icon, title, value, compact = false }: MetricCardProps) {
  if (compact) {
    return (
      <div className="rounded-md border p-3">
        <div className="mb-3 grid h-9 w-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5">
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}
