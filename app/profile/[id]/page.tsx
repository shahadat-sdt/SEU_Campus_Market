import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Params = Promise<{ id: string }>;

export default async function ProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const seller = await db.user.findUnique({
    where: { id },
    include: {
      listings: {
        where: currentUser?.id === id ? {} : { status: "ACTIVE" },
        include: {
          seller: true,
          votes: true,
          wishlistItems: currentUser ? { where: { userId: currentUser.id } } : false
        },
        orderBy: { createdAt: "desc" }
      },
      purchases: { include: { listing: true, seller: true }, orderBy: { createdAt: "desc" } },
      wishlistItems: {
        include: {
          listing: {
            include: {
              seller: true,
              votes: true,
              wishlistItems: currentUser ? { where: { userId: currentUser.id } } : false
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      reviewsReceived: { include: { buyer: true }, orderBy: { createdAt: "desc" } }
    }
  });
  if (!seller) notFound();

  const rating = seller.reviewsReceived.length
    ? seller.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / seller.reviewsReceived.length
    : 0;
  const isOwnProfile = currentUser?.id === seller.id;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-lg border bg-card p-6 shadow-campus">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-md bg-secondary text-xl font-semibold">
                {seller.avatarUrl ? (
                  <Image src={seller.avatarUrl} alt={seller.name} width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  seller.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold">{seller.name}</h1>
                  {seller.emailVerifiedAt && <Badge variant="mint"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  SEU student seller{isOwnProfile ? ` · ${seller.email}` : ""}
                </p>
              </div>
            </div>
            {seller.bio && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{seller.bio}</p>}
            {seller.preferredPickup && (
              <p className="mt-2 text-sm text-muted-foreground">Preferred pickup: {seller.preferredPickup}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{rating ? rating.toFixed(1) : "New"}</span>
              <span className="text-sm text-muted-foreground">({seller.reviewsReceived.length} reviews)</span>
            </div>
            {isOwnProfile && (
              <Button asChild variant="outline" size="sm">
                <Link href="/profile/edit">Edit profile</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="mb-4 font-semibold">{isOwnProfile ? "My Listings" : "Active listings"}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
            {seller.listings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
            {!seller.listings.length && <p className="text-sm text-muted-foreground">No active listings yet.</p>}
          </div>
          {isOwnProfile && (
            <>
              <h2 className="mb-4 mt-8 font-semibold">My Orders</h2>
              <div className="space-y-3">
                {seller.purchases.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="grid gap-2 pt-5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/listings/${order.listingId}`} className="font-medium text-primary underline">{order.listing.title}</Link>
                        <Badge variant={order.status === "COMPLETED" ? "mint" : "warm"}>{order.status}</Badge>
                      </div>
                      <p className="text-muted-foreground">{money(order.agreedPrice.toString())} · Seller: {order.seller.name} · {shortDate(order.createdAt)}</p>
                    </CardContent>
                  </Card>
                ))}
                {!seller.purchases.length && <p className="text-sm text-muted-foreground">No orders yet.</p>}
              </div>
              <h2 className="mb-4 mt-8 font-semibold">Wishlist</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
                {seller.wishlistItems.map((item) => (
                  <ProductCard key={item.id} listing={item.listing} />
                ))}
                {!seller.wishlistItems.length && <p className="text-sm text-muted-foreground">No wishlist items yet.</p>}
              </div>
            </>
          )}
        </section>
        <section>
          <h2 className="mb-4 font-semibold">Seller reviews</h2>
          <Card>
            <CardHeader><CardTitle className="text-base">What buyers said</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {seller.reviewsReceived.map((review) => (
                <div key={review.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{review.buyer.name}</span>
                    <span>{review.rating}/5</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
              {!seller.reviewsReceived.length && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
