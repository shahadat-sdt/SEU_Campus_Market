import Link from "next/link";
import { PackageCheck, PackagePlus, ShoppingBag, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { deleteListing, resendVerificationEmail, updateListingStatus, updateOrder } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { listingStatuses, orderStatuses } from "@/lib/constants";
import { db } from "@/lib/db";
import { safeImageUrl } from "@/lib/image";
import { money } from "@/lib/utils";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default async function SellPage() {
  const user = await requireUser();
  const [listings, sales, pendingOrders] = await Promise.all([
    db.listing.findMany({
      where: { sellerId: user.id },
      include: { orders: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    db.order.findMany({
      where: { sellerId: user.id, status: "COMPLETED" },
      select: { agreedPrice: true },
      take: 200
    }),
    db.order.findMany({
      where: { sellerId: user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: {
        listing: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  const revenue = sales.reduce((sum, order) => sum + Number(order.agreedPrice), 0);
  const activeCount = listings.filter((listing) => listing.status === "ACTIVE").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="section-shell campus-grid mb-6 grid gap-4 rounded-lg border bg-card/85 p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Sell on campus</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Manage listings and handovers.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Post products, track open requests, update statuses, and keep buyer communication in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/new"><PackagePlus className="h-4 w-4" /> New listing</Link>
        </Button>
      </div>

      {!user.emailVerifiedAt && (
        <div className="mb-6 grid gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Verify your email to post listings and place orders.</p>
          <form action={resendVerificationEmail}>
            <PendingSubmitButton size="sm" variant="outline" pendingChildren="Sending email">
              Resend verification email
            </PendingSubmitButton>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={TrendingUp} title="Total sales" value={money(revenue)} />
        <Stat icon={ShoppingBag} title="Open orders" value={pendingOrders.length.toString()} />
        <Stat icon={PackageCheck} title="Active listings" value={activeCount.toString()} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader><CardTitle>Open orders</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pendingOrders.map((order) => (
              <div key={order.id} className="grid gap-3 rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/listings/${order.listingId}`} className="font-medium text-primary underline">
                      {order.listing.title}
                    </Link>
                    <p className="mt-1 text-muted-foreground">Buyer: {order.buyer.name} · {money(order.agreedPrice.toString())}</p>
                  </div>
                  <Badge variant="warm">{order.status}</Badge>
                </div>
                <form action={updateOrder} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="orderId" value={order.id} />
                  <Select name="status" defaultValue={order.status}>
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                  <PendingSubmitButton size="sm" pendingChildren="Updating">Update</PendingSubmitButton>
                </form>
              </div>
            ))}
            {!pendingOrders.length && <p className="text-sm text-muted-foreground">No open orders right now.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your listings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {listings.map((listing) => (
              <div key={listing.id} className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="grid min-w-0 grid-cols-[72px_1fr] gap-3">
                  <img
                    src={safeImageUrl(listing.imageUrls[0] || listing.imageUrl)}
                    alt={listing.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full rounded-md object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/listings/${listing.id}`} className="font-medium text-primary underline">
                        {listing.title}
                      </Link>
                      <Badge variant={listing.status === "ACTIVE" ? "mint" : "warm"}>{listing.status}</Badge>
                      <Badge variant="outline">{listing.category}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {money(listing.price.toString())} · {listing.orders.length} order request(s)
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
                  </Button>
                  <form action={updateListingStatus} className="grid w-full gap-2 sm:w-auto sm:grid-cols-[128px_auto]">
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="returnTo" value="/sell" />
                    <Select name="status" defaultValue={listing.status}>
                      {listingStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </Select>
                    <PendingSubmitButton size="sm" pendingChildren="Saving">Save</PendingSubmitButton>
                  </form>
                  <form action={deleteListing}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <PendingSubmitButton size="sm" variant="destructive" pendingChildren="Deleting">
                      Delete
                    </PendingSubmitButton>
                  </form>
                </div>
              </div>
            ))}
            {!listings.length && <p className="text-sm text-muted-foreground">Post your first item to manage it here.</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5">
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
