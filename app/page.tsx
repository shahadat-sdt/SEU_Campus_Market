import Image from "next/image";
import Link from "next/link";
import { Search, ShieldCheck, Star, Tag } from "lucide-react";
import { followCategory } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { categories } from "@/lib/constants";
import { db } from "@/lib/db";
import { money, shortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const q = first(params.q) || "";
  const category = first(params.category) || "";

  const listings = await db.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { code: { contains: q.toUpperCase(), mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: {
      seller: {
        include: { reviewsReceived: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main>
      <section className="campus-grid border-b bg-background/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr] md:py-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Verified Southeast University student marketplace
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">
                Buy, sell, and hand over safely between classes.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                A clean campus feed for food, notes, electronics, clothing, handmade items, and used goods.
              </p>
            </div>
            <form className="grid gap-3 rounded-lg border bg-card p-3 shadow-campus sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input name="q" defaultValue={q} placeholder="Search title, description, or product code" className="pl-9" />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
          <div className="grid content-end gap-3">
            <div className="rounded-lg border bg-card p-5 shadow-campus">
              <p className="text-sm text-muted-foreground">Active listings</p>
              <p className="mt-2 text-5xl font-semibold">{listings.length}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Product codes, ratings, order records, payment confirmations, and pickup points are built in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-3">
          <Button asChild variant={!category ? "default" : "outline"} size="sm">
            <Link href="/">All</Link>
          </Button>
          {categories.map((item) => (
            <form key={item} action={followCategory} className="flex shrink-0 items-center gap-2">
              <input type="hidden" name="category" value={item} />
              <Button asChild variant={category === item ? "default" : "outline"} size="sm">
                <Link href={`/?category=${encodeURIComponent(item)}`}>{item}</Link>
              </Button>
              {user && (
                <Button variant="ghost" size="sm" title={`Follow ${item}`}>
                  Follow
                </Button>
              )}
            </form>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const reviews = listing.seller.reviewsReceived;
            const rating = reviews.length
              ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
              : 0;

            return (
              <Link href={`/listings/${listing.id}`} key={listing.id}>
                <Card className="h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-campus">
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover" />
                  </div>
                  <CardContent className="space-y-4 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{listing.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{listing.seller.name}</p>
                      </div>
                      <Badge variant="mint">{listing.category}</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-lg font-semibold">{money(listing.price.toString())}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {rating ? rating.toFixed(1) : "New"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {listing.code}</span>
                      <span>{shortDate(listing.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {!listings.length && (
          <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
            No listing found. Try another keyword or category.
          </div>
        )}
      </section>
    </main>
  );
}
