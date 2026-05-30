import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
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
      listings: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } },
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
            <h1 className="text-3xl font-semibold">{seller.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Verified SEU student seller · {seller.email}</p>
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
          <h2 className="mb-4 font-semibold">Active listings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {seller.listings.map((listing) => (
              <Link href={`/listings/${listing.id}`} key={listing.id}>
                <Card className="h-full overflow-hidden transition hover:shadow-campus">
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover" />
                  </div>
                  <CardContent className="space-y-2 pt-5">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">{listing.title}</p>
                      <Badge variant="mint">{listing.category}</Badge>
                    </div>
                    <p className="font-semibold">{money(listing.price.toString())}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {!seller.listings.length && <p className="text-sm text-muted-foreground">No active listings yet.</p>}
          </div>
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
