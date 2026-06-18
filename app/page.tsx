import Link from "next/link";
import { ArrowRight, PackagePlus, Search, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();
  const [activeListings, activeSellers] = await Promise.all([
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { listings: { some: { status: "ACTIVE" } } } })
  ]);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-6xl content-center gap-10 px-4 py-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Southeast University student marketplace
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              A cleaner way to buy and sell on campus.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Browse active listings, post your own items, manage orders, and keep handovers organized around verified student accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="default">
              <Link href="/buy"><Search className="h-4 w-4" /> Start buying</Link>
            </Button>
            <Button asChild variant="outline" size="default">
              <Link href={user ? "/sell" : "/login"}><PackagePlus className="h-4 w-4" /> Start selling</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm">
          <SummaryRow label="Active listings" value={activeListings.toString()} />
          <SummaryRow label="Student sellers" value={activeSellers.toString()} />
          <Link href="/buy" className="mt-2 inline-flex items-center justify-between rounded-md border p-3 text-sm font-medium hover:bg-accent">
            Browse marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-background p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}
