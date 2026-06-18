import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, MessageCircle, ShieldCheck, Star, Tag, ThumbsDown, ThumbsUp } from "lucide-react";
import { createComment, deleteListing, placeOrder, reportComment, toggleVote, toggleWishlist, updateListingStatus } from "@/lib/actions";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { listingStatuses, meetupPoints } from "@/lib/constants";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/utils";
import { ReportButton } from "@/components/report-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ListingPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      seller: { include: { reviewsReceived: { include: { buyer: true }, orderBy: { createdAt: "desc" } } } },
      reports: true,
      orders: { where: { status: { not: "CANCELLED" } }, select: { quantity: true } },
      votes: true,
      wishlistItems: user ? { where: { userId: user.id } } : false,
      comments: {
        where: { parentId: null },
        include: {
          user: true,
          replies: { include: { user: true }, orderBy: { createdAt: "asc" } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!listing) notFound();

  const reviews = listing.seller.reviewsReceived;
  const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const isSeller = user?.id === listing.sellerId;
  const images = listing.imageUrls.length ? listing.imageUrls : [listing.imageUrl || "https://placehold.co/1200x900?text=SEU+Market"];
  const likes = listing.votes.filter((vote) => vote.voteType === "LIKE").length;
  const dislikes = listing.votes.filter((vote) => vote.voteType === "DISLIKE").length;
  const wishlisted = !!listing.wishlistItems.length;
  const reserved = listing.orders.reduce((sum, order) => sum + order.quantity, 0);
  const availableStock = Math.max(0, listing.quantity - reserved);
  const stockError = query.error === "stock";
  if (listing.status !== "ACTIVE" && !isSeller) notFound();

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-5">
        <div className="relative overflow-hidden rounded-md border bg-muted shadow-campus">
          <Image src={images[0]} alt={listing.title} width={1200} height={900} className="aspect-[4/3] w-full object-cover" />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.slice(0, 4).map((image, index) => (
              <div key={image} className="relative overflow-hidden rounded-md border bg-muted">
                <Image src={image} alt={`${listing.title} photo ${index + 1}`} width={240} height={180} className="aspect-[4/3] w-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{listing.title}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{listing.description || "No description provided."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.sponsored && <Badge>Sponsored</Badge>}
                <Badge variant="mint">{listing.category}</Badge>
                <Badge variant="outline">{listing.condition}</Badge>
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
              <p className="text-sm text-muted-foreground">Stock</p>
              <p className="text-sm">{availableStock} of {listing.quantity} available</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product code</p>
              <p className="flex items-center gap-1 font-mono text-sm"><Tag className="h-4 w-4" /> {listing.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Posted</p>
              <p className="text-sm">{shortDate(listing.createdAt)}</p>
            </div>
            <div className="sm:col-span-3 flex flex-wrap gap-2">
              {listing.negotiable && <Badge variant="secondary">Negotiable</Badge>}
              {listing.campusPickup && <Badge variant="outline">Campus pickup</Badge>}
              {listing.whatsappContact && <Badge variant="outline">WhatsApp contact</Badge>}
              {listing.deliveryAvailable && <Badge variant="outline">Delivery available</Badge>}
              {listing.tags.map((tag) => <Badge key={tag} variant="outline">#{tag}</Badge>)}
            </div>
            <div className="sm:col-span-3 flex flex-wrap gap-2">
              <form action={toggleVote}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="voteType" value="LIKE" />
                <Button variant="outline" size="sm"><ThumbsUp className="h-4 w-4" /> {likes}</Button>
              </form>
              <form action={toggleVote}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="voteType" value="DISLIKE" />
                <Button variant="outline" size="sm"><ThumbsDown className="h-4 w-4" /> {dislikes}</Button>
              </form>
              <form action={toggleWishlist}>
                <input type="hidden" name="listingId" value={listing.id} />
                <Button variant={wishlisted ? "secondary" : "outline"} size="sm">
                  <Heart className={wishlisted ? "h-4 w-4 fill-current" : "h-4 w-4"} /> Wishlist
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Comments</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <form action={createComment} className="grid gap-2 rounded-md border p-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <Textarea name="body" maxLength={500} placeholder="Ask a product question or leave a public comment" required />
                <Button size="sm" className="justify-self-start">Post comment</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">Login to comment on this product.</p>
            )}
            {listing.comments.map((comment) => (
              <div key={comment.id} className="space-y-3 rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{comment.user.name}</p>
                    <p className="text-xs text-muted-foreground">{shortDate(comment.createdAt)}</p>
                  </div>
                  {user && (
                    <form action={reportComment}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <input type="hidden" name="listingId" value={listing.id} />
                      <Button variant="ghost" size="sm">Report</Button>
                    </form>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{comment.body}</p>
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="ml-4 rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium">{reply.user.name}{reply.userId === listing.sellerId ? " · Seller" : ""}</p>
                    <p className="mt-1 text-muted-foreground">{reply.body}</p>
                  </div>
                ))}
                {isSeller && (
                  <form action={createComment} className="flex gap-2">
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="parentId" value={comment.id} />
                    <Input name="body" placeholder="Reply as seller" required />
                    <Button size="sm">Reply</Button>
                  </form>
                )}
              </div>
            ))}
            {!listing.comments.length && <p className="text-sm text-muted-foreground">No comments yet.</p>}
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-5">
        <Card className="shadow-campus">
          <CardHeader>
            <CardTitle>Seller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/profile/${listing.sellerId}`} className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-md bg-secondary font-semibold">
                  {listing.seller.avatarUrl ? (
                    <Image src={listing.seller.avatarUrl} alt={listing.seller.name} width={48} height={48} className="h-full w-full object-cover" />
                  ) : (
                    listing.seller.name.slice(0, 1).toUpperCase()
                  )}
                </span>
                <span>
                  <span className="block font-semibold text-primary underline">Sold by {listing.seller.name}</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {rating ? rating.toFixed(1) : "New"}
                  </span>
                </span>
              </Link>
            </div>
            <p className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Contact information stays private until an order is confirmed.
            </p>
            {!isSeller && (
              user ? <ReportButton productId={listing.id} reporterId={user.id} /> : null
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
                Orders for this item appear in your orders and selling pages.
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
          <OrderBox listingId={listing.id} stock={availableStock} showStockError={stockError} />
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

async function OrderBox({ listingId, stock, showStockError }: { listingId: string; stock: number; showStockError: boolean }) {
  await requireUser();
  return (
    <Card className="shadow-campus">
      <CardHeader>
        <CardTitle>Place order</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={placeOrder} className="space-y-4">
          <input type="hidden" name="listingId" value={listingId} />
          {showStockError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Requested quantity exceeds available stock.
            </p>
          )}
          <Input name="quantity" type="number" min="1" max={stock} defaultValue="1" required />
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
