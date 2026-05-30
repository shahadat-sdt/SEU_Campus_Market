import Link from "next/link";
import { CheckCircle2, CreditCard, PackageCheck, XCircle } from "lucide-react";
import { addPaymentNote, cancelOrder, createReview, markPaymentReceived, updateOrder } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { orderStatuses } from "@/lib/constants";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function OrdersPage() {
  const user = await requireUser();
  const [buying, selling] = await Promise.all([
    db.order.findMany({
      where: { buyerId: user.id },
      include: { listing: true, seller: true, review: true },
      orderBy: { createdAt: "desc" }
    }),
    db.order.findMany({
      where: { sellerId: user.id },
      include: { listing: true, buyer: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Orders</h1>
        <p className="mt-2 text-muted-foreground">
          Track requests, confirmations, pickup readiness, completion, and payment proof.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="font-semibold">Buying</h2>
          {buying.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    <Link href={`/listings/${order.listingId}`} className="underline">{order.listing.title}</Link>
                  </CardTitle>
                  <Badge variant={order.status === "COMPLETED" ? "mint" : "warm"}>{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Seller: {order.seller.name}</p>
                <p>{order.quantity} item(s), {money(order.agreedPrice.toString())}, pickup at {order.pickupPoint}</p>
                <p className="text-muted-foreground">Payment: {order.paymentStatus} · {shortDate(order.createdAt)}</p>
                {canRevealContact(order.status) && (
                  <div className="rounded-md border bg-secondary/40 p-3">
                    <p className="font-medium">Seller contact</p>
                    <p className="text-muted-foreground">{order.seller.email}{order.seller.phone ? ` · ${order.seller.phone}` : ""}</p>
                  </div>
                )}
                {order.statusNote && <p className="rounded-md bg-muted p-3 text-muted-foreground">Status note: {order.statusNote}</p>}
                {order.paymentNote && <p className="rounded-md bg-muted p-3 text-muted-foreground">Payment note: {order.paymentNote}</p>}
                {order.status !== "CANCELLED" && order.paymentStatus !== "RECEIVED" && (
                  <form action={addPaymentNote} className="grid gap-2 rounded-md border p-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <Input name="paymentNote" placeholder="bKash/Nagad/Cash note or transaction reference" defaultValue={order.paymentNote || ""} required />
                    <Button size="sm" variant="outline"><CreditCard className="h-4 w-4" /> Save payment note</Button>
                  </form>
                )}
                {order.status === "PENDING" && (
                  <form action={cancelOrder} className="grid gap-2 rounded-md border p-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <Input name="reason" placeholder="Cancellation reason" />
                    <Button size="sm" variant="destructive"><XCircle className="h-4 w-4" /> Cancel request</Button>
                  </form>
                )}
                {order.status === "COMPLETED" && !order.review && (
                  <form action={createReview} className="grid gap-2 rounded-md border p-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <Select name="rating" defaultValue="5">
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </Select>
                    <Textarea name="comment" placeholder="Write a short seller review" required />
                    <Button size="sm">Submit review</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
          {!buying.length && <EmptyState text="You have not ordered anything yet." />}
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold">Selling</h2>
          {selling.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    <Link href={`/listings/${order.listingId}`} className="underline">{order.listing.title}</Link>
                  </CardTitle>
                  <Badge variant={order.status === "COMPLETED" ? "mint" : "warm"}>{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">Buyer: {order.buyer.name}</p>
                <p>{order.quantity} item(s), {money(order.agreedPrice.toString())}, pickup at {order.pickupPoint}</p>
                <p className="text-muted-foreground">Payment: {order.paymentStatus} · {shortDate(order.createdAt)}</p>
                {canRevealContact(order.status) && (
                  <div className="rounded-md border bg-secondary/40 p-3">
                    <p className="font-medium">Buyer contact</p>
                    <p className="text-muted-foreground">{order.buyer.email}{order.buyer.phone ? ` · ${order.buyer.phone}` : ""}</p>
                  </div>
                )}
                {order.note && <p className="rounded-md bg-muted p-3 text-muted-foreground">Buyer note: {order.note}</p>}
                {order.paymentNote && <p className="rounded-md bg-muted p-3 text-muted-foreground">Payment note: {order.paymentNote}</p>}
                {order.statusNote && <p className="rounded-md bg-muted p-3 text-muted-foreground">Status note: {order.statusNote}</p>}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <form action={updateOrder} className="grid gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <div className="flex gap-2">
                      <Select name="status" defaultValue={order.status}>
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </Select>
                      <Button size="sm"><PackageCheck className="h-4 w-4" /> Update</Button>
                    </div>
                    <Input name="statusNote" placeholder="Optional update or rejection reason" defaultValue={order.statusNote || ""} />
                  </form>
                  <form action={markPaymentReceived}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button size="sm" variant="outline" disabled={order.paymentStatus === "RECEIVED"}>
                      <CreditCard className="h-4 w-4" /> Paid
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
          {!selling.length && <EmptyState text="No one has ordered from you yet." />}
        </section>
      </div>
    </main>
  );
}

function canRevealContact(status: string) {
  return status === "CONFIRMED" || status === "READY" || status === "COMPLETED";
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
      <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
      {text}
    </div>
  );
}
