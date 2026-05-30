import Link from "next/link";
import { updateListingStatus } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { listingStatuses } from "@/lib/constants";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default async function DashboardPage() {
  const user = await requireUser();
  const [listings, sales, pendingOrders] = await Promise.all([
    db.listing.findMany({ where: { sellerId: user.id }, include: { orders: true }, orderBy: { createdAt: "desc" } }),
    db.order.findMany({ where: { sellerId: user.id, status: "COMPLETED" }, include: { listing: true } }),
    db.order.findMany({ where: { sellerId: user.id, status: "PENDING" }, include: { listing: true, buyer: true } })
  ]);

  const revenue = sales.reduce((sum, order) => sum + Number(order.agreedPrice), 0);
  const popular = [...listings].sort((a, b) => b.orders.length - a.orders.length)[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Seller dashboard</h1>
          <p className="mt-2 text-muted-foreground">Simple sales, popular item, and pending order view.</p>
        </div>
        <Button asChild><Link href="/listings/new">Post listing</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Total sales" value={money(revenue)} />
        <Stat title="Pending orders" value={pendingOrders.length.toString()} />
        <Stat title="Active listings" value={listings.filter((listing) => listing.status === "ACTIVE").length.toString()} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Popular item</CardTitle></CardHeader>
          <CardContent>
            {popular ? (
              <div className="space-y-2">
                <Link href={`/listings/${popular.id}`} className="font-semibold text-primary underline">{popular.title}</Link>
                <p className="text-sm text-muted-foreground">{popular.orders.length} order request(s)</p>
                <Badge variant="mint">{popular.category}</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Post your first item to see demand.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending orders</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pendingOrders.map((order) => (
              <div key={order.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{order.listing.title}</p>
                <p className="text-muted-foreground">Buyer: {order.buyer.name} · {money(order.agreedPrice.toString())}</p>
              </div>
            ))}
            {!pendingOrders.length && <p className="text-sm text-muted-foreground">No pending orders right now.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Your listings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-[1fr_auto]">
              <div>
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
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
                </Button>
                <form action={updateListingStatus} className="flex gap-2">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Select name="status" defaultValue={listing.status} className="w-32">
                    {listingStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                  <Button size="sm">Save</Button>
                </form>
              </div>
            </div>
          ))}
          {!listings.length && <p className="text-sm text-muted-foreground">Post your first item to manage it here.</p>}
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
