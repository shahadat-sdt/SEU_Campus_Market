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
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Badge } from "@/components/ui/badge";
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

      <section className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">Admin privileges</h2>
              <Badge variant="mint"><ShieldCheck className="h-3.5 w-3.5" /> Admin only</Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This section is only available to accounts with the ADMIN role and matches the documented command-layer privileges.
            </p>
          </div>
          <div className="rounded-md border bg-secondary/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Current role</span>
            <span className="ml-2 font-semibold">{admin.role}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PrivilegeCard
            icon={AlertTriangle}
            title="Moderate reports"
            description="Hide reported listings, remove reported comments, or dismiss safe reports."
            href="#moderation"
          />
          <PrivilegeCard
            icon={CircleDot}
            title="Control listings"
            description="Set marketplace listing status to active, sold, hidden, or draft."
            href="#listings-control"
          />
          <PrivilegeCard
            icon={Star}
            title="Sponsor listings"
            description="Promote or remove sponsored visibility for selected listings."
            href="#listings-control"
          />
          <PrivilegeCard
            icon={UsersRound}
            title="Manage roles"
            description="Promote trusted users to admin or return admins to student role with safety checks."
            href="#people-permissions"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={AlertTriangle} title="Open reports" value={openReports.toString()} />
        <Stat icon={CircleDot} title="Active listings" value={activeListings.toString()} />
        <Stat icon={ShieldCheck} title="Hidden listings" value={hiddenListings.toString()} />
        <Stat icon={Star} title="Sponsored" value={sponsoredListings.toString()} />
        <Stat icon={UsersRound} title="Orders" value={orderCount.toString()} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card id="moderation">
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
                        <PendingSubmitButton size="sm" variant="destructive" pendingChildren="Hiding">
                          Hide listing
                        </PendingSubmitButton>
                      </form>
                    )}
                    {report.commentId && (
                      <form action={removeReportedComment}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <input type="hidden" name="commentId" value={report.commentId} />
                        <input type="hidden" name="listingId" value={listingId} />
                        <PendingSubmitButton size="sm" variant="destructive" pendingChildren="Removing">
                          Remove comment
                        </PendingSubmitButton>
                      </form>
                    )}
                    <form action={resolveReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <PendingSubmitButton size="sm" variant="outline" pendingChildren="Dismissing">
                        Dismiss
                      </PendingSubmitButton>
                    </form>
                  </div>
                </div>
              );
            })}
            {!reports.length && <p className="text-sm text-muted-foreground">No open reports.</p>}
          </CardContent>
        </Card>

        <Card id="people-permissions">
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
                <form action={updateUserRole} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="userId" value={user.id} />
                  <Select name="role" defaultValue={user.role} disabled={user.id === admin.id}>
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                  <PendingSubmitButton size="sm" disabled={user.id === admin.id} pendingChildren="Saving">
                    Save
                  </PendingSubmitButton>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card id="listings-control" className="mt-6">
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
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <form action={adminUpdateListingStatus} className="grid w-full gap-2 sm:w-auto sm:grid-cols-[128px_auto]">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Select name="status" defaultValue={listing.status}>
                    {listingStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                  <PendingSubmitButton size="sm" pendingChildren="Setting">Set</PendingSubmitButton>
                </form>
                <form action={toggleSponsoredListing}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="sponsored" value={listing.sponsored ? "false" : "true"} />
                  <PendingSubmitButton size="sm" variant={listing.sponsored ? "outline" : "default"} pendingChildren="Saving">
                    {listing.sponsored ? "Unsponsor" : "Sponsor"}
                  </PendingSubmitButton>
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

function PrivilegeCard({
  icon: Icon,
  title,
  description,
  href
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="grid gap-3 rounded-md border bg-background/80 p-3 text-sm transition hover:border-primary/40 hover:bg-accent">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="font-semibold">{title}</span>
      <span className="leading-5 text-muted-foreground">{description}</span>
    </Link>
  );
}
