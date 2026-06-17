import Link from "next/link";
import { hideReportedListing, resolveReport, toggleSponsoredListing } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  await requireAdmin();
  const [reports, hiddenCount, userCount, listings] = await Promise.all([
    db.report.findMany({
      where: { resolved: false },
      include: { user: true, listing: { include: { seller: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    db.listing.count({ where: { status: "HIDDEN" } }),
    db.user.count(),
    db.listing.findMany({
      where: { status: "ACTIVE" },
      include: { seller: true },
      orderBy: [{ sponsored: "desc" }, { createdAt: "desc" }],
      take: 20
    })
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="mt-2 text-muted-foreground">Review reports and hide unsafe listings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Open reports" value={reports.length.toString()} />
        <Stat title="Hidden listings" value={hiddenCount.toString()} />
        <Stat title="Students" value={userCount.toString()} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Sponsored listings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/listings/${listing.id}`} className="font-medium text-primary underline">{listing.title}</Link>
                  {listing.sponsored && <Badge>Sponsored</Badge>}
                  <Badge variant="outline">{listing.category}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">Seller: {listing.seller.name}</p>
              </div>
              <form action={toggleSponsoredListing}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="sponsored" value={listing.sponsored ? "false" : "true"} />
                <Button size="sm" variant={listing.sponsored ? "outline" : "default"}>
                  {listing.sponsored ? "Remove sponsor" : "Mark sponsored"}
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Open reports</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warm">{report.reason}</Badge>
                  <span className="text-muted-foreground">{shortDate(report.createdAt)}</span>
                </div>
                <p className="mt-2 text-muted-foreground">Reported by {report.user.name} ({report.user.email})</p>
                {report.listing ? (
                  <p className="mt-1">
                    Listing: <Link href={`/listings/${report.listing.id}`} className="text-primary underline">{report.listing.title}</Link>
                    <span className="text-muted-foreground"> by {report.listing.seller.name}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-muted-foreground">Listing has already been removed.</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {report.listingId && (
                  <form action={hideReportedListing}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="listingId" value={report.listingId} />
                    <Button size="sm" variant="destructive">Hide listing</Button>
                  </form>
                )}
                <form action={resolveReport}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <Button size="sm" variant="outline">Dismiss</Button>
                </form>
              </div>
            </div>
          ))}
          {!reports.length && <p className="text-sm text-muted-foreground">No open reports.</p>}
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card className="shadow-campus">
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
