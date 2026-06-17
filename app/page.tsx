import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { categories, listingCategories } from "@/lib/constants";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const q = first(params.q) || "";
  const category = first(params.category) || "";
  const sort = first(params.sort) || "newest";

  const listings = await db.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(category && listingCategories.includes(category as never) ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { code: { contains: q.toUpperCase(), mode: "insensitive" } },
              { tags: { has: q } }
            ]
          }
        : {})
    },
    include: {
      seller: true,
      votes: true,
      wishlistItems: user ? { where: { userId: user.id } } : false
    },
    orderBy: sort === "price-low"
      ? { price: "asc" }
      : sort === "price-high"
        ? { price: "desc" }
        : [{ sponsored: "desc" }, { createdAt: "desc" }]
  });
  const sponsored = listings.find((listing) => listing.sponsored);
  const regularListings = sponsored ? listings.filter((listing) => listing.id !== sponsored.id) : listings;

  return (
    <main>
      <section className="campus-grid border-b bg-background/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr] md:py-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Southeast University student marketplace
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">
                Buy, sell, and hand over safely between classes.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                A clean campus feed for food, notes, electronics, clothing, handmade items, and used goods.
              </p>
            </div>
            <form className="grid gap-3 rounded-lg border bg-card p-3 shadow-campus sm:grid-cols-[1fr_160px_auto]">
              {category && <input type="hidden" name="category" value={category} />}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input name="q" defaultValue={q} placeholder="Search title, description, or product code" className="pl-9" />
              </div>
              <Select name="sort" defaultValue={sort}>
                <option value="newest">Newest</option>
                <option value="price-low">Price low</option>
                <option value="price-high">Price high</option>
              </Select>
              <Button type="submit">Search</Button>
            </form>
          </div>
          <div className="grid content-end gap-3">
            <div className="rounded-md border bg-card p-5 shadow-campus">
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
          {categories.map((item) => (
            <Button key={item} asChild variant={(item === "All" && !category) || category === item ? "default" : "outline"} size="sm" className="shrink-0">
              <Link href={item === "All" ? "/" : `/?category=${encodeURIComponent(item)}`}>{item}</Link>
            </Button>
          ))}
        </div>

        {sponsored && (
          <div className="mt-5 rounded-md border bg-card p-4 shadow-campus">
            <p className="mb-3 text-sm font-semibold text-primary">Sponsored</p>
            <ProductCard listing={sponsored} />
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {regularListings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>

        {!listings.length && (
          <div className="rounded-md border bg-card p-10 text-center text-muted-foreground">
            No listing found. Try another keyword or category.
          </div>
        )}
      </section>
    </main>
  );
}
