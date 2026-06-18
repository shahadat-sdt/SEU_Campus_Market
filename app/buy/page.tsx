import Link from "next/link";
import { Search } from "lucide-react";
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

export default async function BuyPage({ searchParams }: { searchParams: SearchParams }) {
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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Buy on campus</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Find what students are selling now.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Search active listings, compare prices, save favorites, and place a request for a safe campus handover.
          </p>
        </div>
        <div className="rounded-md border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Active listings</span>
          <span className="ml-3 text-xl font-semibold">{listings.length}</span>
        </div>
      </section>

      <form className="grid gap-3 rounded-lg border bg-card p-3 shadow-sm sm:grid-cols-[1fr_160px_auto]">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search by title, details, tag, or code" className="pl-9" />
        </div>
        <Select name="sort" defaultValue={sort}>
          <option value="newest">Newest</option>
          <option value="price-low">Price low</option>
          <option value="price-high">Price high</option>
        </Select>
        <Button type="submit">Search</Button>
      </form>

      <section className="py-6">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {categories.map((item) => (
            <Button key={item} asChild variant={(item === "All" && !category) || category === item ? "default" : "outline"} size="sm" className="shrink-0">
              <Link href={item === "All" ? "/buy" : `/buy?category=${encodeURIComponent(item)}`}>{item}</Link>
            </Button>
          ))}
        </div>

        {sponsored && (
          <div className="mt-5 rounded-md border bg-card p-4">
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
          <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
            No listing found. Try another keyword or category.
          </div>
        )}
      </section>
    </main>
  );
}
