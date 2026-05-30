import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, ShieldCheck, Star, Tag } from "lucide-react";
import { deleteListing, placeOrder, reportListing, updateListingStatus } from "@/lib/actions";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { listingStatuses, meetupPoints } from "@/lib/constants";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Params = Promise<{ id: string }>;

export default async function ListingPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      seller: { include: { reviewsReceived: { include: { buyer: true }, orderBy: { createdAt: "desc" } } } },
      reports: true
    }
  });

  if (!listing) notFound();

  const reviews = listing.seller.reviewsReceived;
  const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const isSeller = user?.id === listing.sellerId;
  if (listing.status !== "ACTIVE" && !isSeller) notFound();

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-5">
        <div className="relative overflow-hidden rounded-lg border bg-muted shadow-campus">
          <Image src={listing.imageUrl} alt={listing.title} width={1200} height={900} className="aspect-[4/3] w-full object-cover" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{listing.title}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{listing.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="mint">{listing.category}</Badge>
                {listing.status !== "ACTIVE" && <Badge variant="warm">{listing.status}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-xl font-semibold">{money(listing.price.toString())}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product code</p>
              <p className="flex items-center gap-1 font-mono text-sm"><Tag className="h-4 w-4" /> {listing.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Posted</p>
              <p className="text-sm">{shortDate(listing.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-5">
        <Card className="shadow-campus">
          <CardHeader>
            <CardTitle>Seller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Link href={`/profile/${listing.sellerId}`} className="font-semibold text-primary underline">
                {listing.seller.name}
              </Link>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {rating ? rating.toFixed(1) : "New"}
              </span>
            </div>
            <p className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Contact information stays private until an order is confirmed.
            </p>
            {!isSeller && (
              <form action={reportListing} className="flex gap-2">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="reason" value="Suspicious listing" />
                <Button variant="outline" size="sm"><Flag className="h-4 w-4" /> Report</Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!user ? (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <p className="text-sm text-muted-foreground">Login with your SEU account to place an order.</p>
              <Button asChild className="w-full"><Link href="/login">Login to order</Link></Button>
            </CardContent>
          </Card>
        ) : isSeller ? (
          <Card>
            <CardHeader>
              <CardTitle>Manage listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Orders for this item appear in your orders page and dashboard.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/listings/${listing.id}/edit`}>Edit details</Link>
                </Button>
                <form action={updateListingStatus} className="flex gap-2">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="returnTo" value={`/listings/${listing.id}`} />
                  <Select name="status" defaultValue={listing.status} className="w-32">
                    {listingStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Select>
                  <Button size="sm">Save</Button>
                </form>
                <form action={deleteListing}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Button size="sm" variant="destructive">Delete</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ) : listing.status !== "ACTIVE" ? (
          <Card>
            <CardContent className="pt-5 text-sm text-muted-foreground">
              This listing is no longer accepting new orders.
            </CardContent>
          </Card>
        ) : (
          <OrderBox listingId={listing.id} />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.slice(0, 4).map((review) => (
              <div key={review.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{review.buyer.name}</span>
                  <span>{review.rating}/5</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
            {!reviews.length && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          </CardContent>
        </Card>
      </aside>
    </main>
  );
}

async function OrderBox({ listingId }: { listingId: string }) {
  await requireUser();
  return (
    <Card className="shadow-campus">
      <CardHeader>
        <CardTitle>Place order</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={placeOrder} className="space-y-4">
          <input type="hidden" name="listingId" value={listingId} />
          <Input name="quantity" type="number" min="1" defaultValue="1" required />
          <Select name="pickupPoint" required defaultValue="">
            <option value="" disabled>Safe meetup point</option>
            {meetupPoints.map((point) => (
              <option key={point} value={point}>{point}</option>
            ))}
          </Select>
          <Textarea name="note" placeholder="Preferred time, class break, or payment note" />
          <Button className="w-full">Send order request</Button>
        </form>
      </CardContent>
    </Card>
  );
}
