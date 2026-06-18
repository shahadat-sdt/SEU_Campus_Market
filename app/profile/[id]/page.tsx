import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Heart,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Star
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
      _count: {
        select: {
          listings: true,
          purchases: true,
          sales: true,
          wishlistItems: true,
          reviewsReceived: true
        }
      },
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
  const visibleContact = [
    {
      icon: Mail,
      label: "Email",
      value: isOwnProfile ? seller.email : seller.emailVerifiedAt ? "Verified university email" : "Not verified yet"
    },
    {
      icon: Phone,
      label: "Phone or WhatsApp",
      value: isOwnProfile ? seller.phone || "Not added yet" : seller.phone ? "Available after confirmed order" : "Not shared"
    },
    {
      icon: MapPin,
      label: "Preferred pickup",
      value: seller.preferredPickup || "No preferred pickup point"
    },
    {
      icon: CalendarDays,
      label: "Member since",
      value: profileDate(seller.createdAt)
    }
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-lg border bg-card p-6 shadow-campus">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary text-2xl font-semibold">
              {seller.avatarUrl ? (
                <Image src={seller.avatarUrl} alt={seller.name} width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                seller.name.slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-3xl font-semibold">{seller.name}</h1>
                {seller.emailVerifiedAt && <Badge variant="mint"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</Badge>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                SEU student seller{seller.preferredPickup ? ` · Prefers ${seller.preferredPickup}` : ""}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                {seller.bio || (isOwnProfile
                  ? "Add a short bio so buyers know your department, pickup style, and what you usually sell."
                  : "This seller has not added a bio yet.")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2 lg:justify-end">
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {visibleContact.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3 rounded-md border p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <ProfileStat icon={Package} label={isOwnProfile ? "Total listings" : "Active listings"} value={seller.listings.length.toString()} />
            <ProfileStat icon={Star} label="Reviews" value={seller._count.reviewsReceived.toString()} />
            {isOwnProfile ? (
              <>
                <ProfileStat icon={ShoppingBag} label="Orders" value={seller._count.purchases.toString()} />
                <ProfileStat icon={Heart} label="Wishlist" value={seller._count.wishlistItems.toString()} />
              </>
            ) : (
              <>
                <ProfileStat icon={ShoppingBag} label="Completed sales" value={seller._count.sales.toString()} />
                <ProfileStat icon={CheckCircle2} label="Status" value={seller.emailVerifiedAt ? "Verified" : "New"} />
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Marketplace activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isOwnProfile ? "Your listings, purchases, and saved items." : "Listings and buyer feedback for this seller."}
            </p>
          </div>
          {isOwnProfile && (
            <Button asChild size="sm">
              <Link href="/listings/new">Post listing</Link>
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <h3 className="mb-4 font-semibold">{isOwnProfile ? "My Listings" : "Active listings"}</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
              {seller.listings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
              {!seller.listings.length && <p className="text-sm text-muted-foreground">No active listings yet.</p>}
            </div>
            {isOwnProfile && (
              <>
                <h3 className="mb-4 mt-8 font-semibold">My Orders</h3>
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
                <h3 className="mb-4 mt-8 font-semibold">Wishlist</h3>
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
            <h3 className="mb-4 font-semibold">Seller reviews</h3>
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
      </section>
    </main>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function profileDate(date: Date) {
  return new Intl.DateTimeFormat("en-BD", {
    month: "long",
    year: "numeric"
  }).format(date);
}
