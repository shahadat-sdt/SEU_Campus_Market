import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Stat title="Active listings" value={listings.length.toString()} />
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
