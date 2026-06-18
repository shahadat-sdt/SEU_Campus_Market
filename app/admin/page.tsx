import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CircleDot,
  ShieldCheck,
  Star,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  adminUpdateListingStatus,
  hideReportedListing,
  removeReportedComment,
  resolveReport,
  toggleSponsoredListing,
  updateUserRole
} from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { listingStatuses } from "@/lib/constants";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const roleError = Array.isArray(params.role) ? params.role[0] : params.role;
  const [
    reports,
    users,
    listings,
    openReports,
    activeListings,
    hiddenListings,
    sponsoredListings,
    orderCount,
    adminCount
  ] = await Promise.all([
    db.report.findMany({
      where: { resolved: false },
      include: {
        user: true,
        listing: { include: { seller: true } },
        comment: { include: { user: true, listing: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    db.user.findMany({
      include: {
        _count: {
          select: {
            listings: true,
            purchases: true,
            sales: true,
            reports: true
          }
        }
      },
      orderBy: [{ role: "desc" }, { createdAt: "desc" }],
      take: 24
    }),
    db.listing.findMany({
      include: { seller: true, reports: { where: { resolved: false }, select: { id: true } } },
      orderBy: [{ sponsored: "desc" }, { createdAt: "desc" }],
      take: 30
    }),
    db.report.count({ where: { resolved: false } }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.listing.count({ where: { status: "HIDDEN" } }),
    db.listing.count({ where: { sponsored: true } }),
    db.order.count(),
    db.user.count({ where: { role: "ADMIN" } })
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Admin panel</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Marketplace control room.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Moderate reports, manage listing visibility, choose sponsored items, and assign trusted admins.
          </p>
        </div>
        <div className="rounded-md border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Signed in as</span>
          <span className="ml-2 font-semibold">{admin.name}</span>
        </div>
      </section>

      {roleError && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          {roleError === "self"
            ? "Admins cannot change their own role."
            : roleError === "last"
              ? "At least one admin must remain."
              : "That user could not be updated."}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={AlertTriangle} title="Open reports" value={openReports.toString()} />
        <Stat icon={CircleDot} title="Active listings" value={activeListings.toString()} />
        <Stat icon={ShieldCheck} title="Hidden listings" value={hiddenListings.toString()} />
        <Stat icon={Star} title="Sponsored" value={sponsoredListings.toString()} />
        <Stat icon={UsersRound} title="Orders" value={orderCount.toString()} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Moderation queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.map((report) => {
              const listingId = report.listingId || report.comment?.listingId || "";
              return (
                <div key={report.id} className="grid gap-3 rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warm">{report.commentId ? "Comment" : "Listing"}</Badge>
                    <Badge variant="outline">{report.reason}</Badge>
                    <span className="text-muted-foreground">{shortDate(report.createdAt)}</span>
                  </div>
                  <p className="text-muted-foreground">
                    Reported by {report.user.name} ({report.user.email})
                  </p>
                  {report.listing ? (
                    <p>
                      Listing: <Link href={`/listings/${report.listing.id}`} className="text-primary underline">{report.listing.title}</Link>
                      <span className="text-muted-foreground"> by {report.listing.seller.name}</span>
                    </p>
                  ) : report.comment ? (
                    <div className="rounded-md bg-muted p-3">
                      <p className="font-medium">Comment by {report.comment.user.name}</p>
                      <p className="mt-1 text-muted-foreground">{report.comment.body}</p>
                      <Link href={`/listings/${report.comment.listingId}`} className="mt-2 inline-block text-primary underline">
                        View listing
                      </Link>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">The reported content has already been removed.</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {report.listingId && (
                      <form action={hideReportedListing}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <input type="hidden" name="listingId" value={report.listingId} />
                        <Button size="sm" variant="destructive">Hide listing</Button>
                      </form>
                    )}
                    {report.commentId && (
                      <form action={removeReportedComment}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <input type="hidden" name="commentId" value={report.commentId} />
                        <input type="hidden" name="listingId" value={listingId} />
                        <Button size="sm" variant="destructive">Remove comment</Button>
                      </form>
                    )}
                    <form action={resolveReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <Button size="sm" variant="outline">Dismiss</Button>
                    </form>
                  </div>
                </div>
              );
            })}
            {!reports.length && <p className="text-sm text-muted-foreground">No open reports.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People and permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-secondary/40 p-3 text-sm">
              <BadgeCheck className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium">{adminCount} admin account(s)</p>
              <p className="mt-1 text-muted-foreground">Admins can moderate reports, change listing visibility, sponsor listings, and manage roles.</p>
            </div>
            {users.map((user) => (
              <div key={user.id} className="grid gap-3 rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.role === "ADMIN" ? "mint" : "outline"}>{user.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {user._count.listings} listings · {user._count.purchases} purchases · {user._count.sales} sales · {user._count.reports} reports filed
                </p>
                <form action={updateUserRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <Select name="role" defaultValue={user.role} disabled={user.id === admin.id}>
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                  <Button size="sm" disabled={user.id === admin.id}>Save</Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Listings control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="grid gap-3 rounded-md border p-3 text-sm lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/listings/${listing.id}`} className="font-medium text-primary underline">{listing.title}</Link>
                  <Badge variant={listing.status === "ACTIVE" ? "mint" : "warm"}>{listing.status}</Badge>
                  {listing.sponsored && <Badge>Sponsored</Badge>}
                  {!!listing.reports.length && <Badge variant="warm">{listing.reports.length} report(s)</Badge>}
                </div>
                <p className="mt-1 text-muted-foreground">
                  Seller: {listing.seller.name} · {listing.category} · {money(listing.price.toString())}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={adminUpdateListingStatus} className="flex gap-2">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Select name="status" defaultValue={listing.status} className="w-32">
                    {listingStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                  <Button size="sm">Set</Button>
                </form>
                <form action={toggleSponsoredListing}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="sponsored" value={listing.sponsored ? "false" : "true"} />
                  <Button size="sm" variant={listing.sponsored ? "outline" : "default"}>
                    {listing.sponsored ? "Unsponsor" : "Sponsor"}
                  </Button>
                </form>
              </div>
            </div>
          ))}
          {!listings.length && <p className="text-sm text-muted-foreground">No listings found.</p>}
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <Icon className="mb-3 h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
