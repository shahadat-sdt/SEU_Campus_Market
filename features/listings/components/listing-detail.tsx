import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, ShieldCheck, Star, Tag, ThumbsDown, ThumbsUp } from "lucide-react";
import { createComment, deleteListing, reportComment, toggleVote, toggleWishlist, updateListingStatus } from "@/features/marketplace/actions";
import { listingStatuses } from "@/shared/lib/constants";
import type { ListingDetailData } from "@/features/marketplace/api/marketplace-api";
import { money, shortDate } from "@/shared/lib/utils";
import { ListingGallery } from "@/features/listings/components/listing-gallery";
import { ListingOrderBox } from "@/features/listings/components/listing-order-box";
import { PendingSubmitButton } from "@/shared/components/feedback/pending-submit-button";
import { ReportButton } from "@/features/reports/components/report-button";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

type ListingUser = { id: string } | null;

export function ListingDetail({ listing, user, stockError }: { listing: ListingDetailData; user: ListingUser; stockError: boolean }) {
  const reviews = listing.seller.reviewsReceived;
  const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const isSeller = user?.id === listing.sellerId;
  const likes = listing.votes.filter((vote) => vote.voteType === "LIKE").length;
  const dislikes = listing.votes.filter((vote) => vote.voteType === "DISLIKE").length;
  const wishlisted = !!listing.wishlistItems?.length;
  const reserved = listing.orders.reduce((sum, order) => sum + order.quantity, 0);
  const availableStock = Math.max(0, listing.quantity - reserved);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-5">
        <ListingGallery title={listing.title} imageUrl={listing.imageUrl} imageUrls={listing.imageUrls} />
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
              {user ? (
                <>
                  <form action={toggleVote}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="voteType" value="LIKE" />
                    <PendingSubmitButton variant="outline" size="sm" pendingChildren="Saving">
                      <ThumbsUp className="h-4 w-4" /> {likes}
                    </PendingSubmitButton>
                  </form>
                  <form action={toggleVote}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="voteType" value="DISLIKE" />
                    <PendingSubmitButton variant="outline" size="sm" pendingChildren="Saving">
                      <ThumbsDown className="h-4 w-4" /> {dislikes}
                    </PendingSubmitButton>
                  </form>
                  <form action={toggleWishlist}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <PendingSubmitButton variant={wishlisted ? "secondary" : "outline"} size="sm" pendingChildren="Saving">
                      <Heart className={wishlisted ? "h-4 w-4 fill-current" : "h-4 w-4"} /> Wishlist
                    </PendingSubmitButton>
                  </form>
                </>
              ) : (
                <>
                  <Badge variant="outline"><ThumbsUp className="h-4 w-4" /> {likes}</Badge>
                  <Badge variant="outline"><ThumbsDown className="h-4 w-4" /> {dislikes}</Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login"><Heart className="h-4 w-4" /> Login to save</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card id="comments">
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Comments</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <form action={createComment} className="grid gap-2 rounded-md border p-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <Textarea name="body" maxLength={500} placeholder="Ask a product question or leave a public comment" required />
                <PendingSubmitButton size="sm" className="w-full sm:w-auto sm:justify-self-start" pendingChildren="Posting comment">
                  Post comment
                </PendingSubmitButton>
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
                      <PendingSubmitButton variant="ghost" size="sm" pendingChildren="Reporting">
                        Report
                      </PendingSubmitButton>
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
                  <form action={createComment} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="parentId" value={comment.id} />
                    <Input name="body" placeholder="Reply as seller" required />
                    <PendingSubmitButton size="sm" pendingChildren="Replying">Reply</PendingSubmitButton>
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
                  <PendingSubmitButton size="sm" pendingChildren="Saving">Save</PendingSubmitButton>
                </form>
                <form action={deleteListing}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <PendingSubmitButton size="sm" variant="destructive" pendingChildren="Deleting">
                    Delete
                  </PendingSubmitButton>
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
          <ListingOrderBox listingId={listing.id} stock={availableStock} showStockError={stockError} />
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
