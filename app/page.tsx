import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, MapPin, PackagePlus, Search, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/features/auth/server/auth";
import { marketplaceApi } from "@/features/marketplace/api/marketplace-api";
import { ProductCard } from "@/features/listings/components/product-card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

export default async function Home() {
  const user = await getCurrentUser();
  const [[activeListings, activeSellers], latestListings] = await Promise.all([
    marketplaceApi.homeStats(),
    marketplaceApi.listings({ sort: "newest", userId: user?.id, limit: 8 })
  ]);

  return (
    <main className="section-shell campus-grid min-h-[calc(100vh-66px)] pb-12">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-md border bg-card/95 px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Southeast University student marketplace
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground md:text-6xl">
              Buy, sell, and hand over campus essentials without the chaos.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              SEU Campus Market gives students a verified place to list products, compare prices, request orders, and arrange handovers around familiar campus spots.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="default">
              <Link href="/buy"><Search className="h-4 w-4" /> Browse listings</Link>
            </Button>
            <Button asChild variant="outline" size="default">
              <Link href={user ? "/sell" : "/login"}><PackagePlus className="h-4 w-4" /> Sell an item</Link>
            </Button>
          </div>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <TrustPill icon={CheckCircle2} label="Verified SEU email" />
            <TrustPill icon={MapPin} label="Campus pickup spots" />
            <TrustPill icon={Clock3} label="Order status tracking" />
          </div>
        </div>

        <MarketplacePreview activeListings={activeListings} activeSellers={activeSellers} />
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Latest listings</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Fresh finds from SEU students.</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/buy">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {latestListings.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {latestListings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} canInteract={!!user} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-card/95 p-10 text-center text-sm text-muted-foreground shadow-sm">
            No active listings yet. Be the first student to post an item.
          </div>
        )}
      </section>
    </main>
  );
}

function TrustPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card/90 px-3 py-2 text-sm text-muted-foreground shadow-sm">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span>{label}</span>
    </div>
  );
}

function MarketplacePreview({ activeListings, activeSellers }: { activeListings: number; activeSellers: number }) {
  const featured = [
    {
      title: "Scientific calculator",
      meta: "Electronics - Like New",
      price: "BDT 850",
      image: "https://images.unsplash.com/photo-1616628188509-808682f3926d?auto=format&fit=crop&w=640&q=80"
    },
    {
      title: "CSE note bundle",
      meta: "Notes - Good",
      price: "BDT 220",
      image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=640&q=80"
    },
    {
      title: "SEU event hoodie",
      meta: "Clothing - New",
      price: "BDT 1,200",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=640&q=80"
    }
  ];

  return (
    <div className="rounded-lg border border-border/80 bg-card/95 p-4 shadow-campus">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            Live campus board
          </p>
          <p className="mt-1 text-sm text-muted-foreground">A compact view of buying activity.</p>
        </div>
        <Badge variant="warm">Open now</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryRow label="Active listings" value={activeListings.toString()} />
        <SummaryRow label="Student sellers" value={activeSellers.toString()} />
      </div>
      <div className="mt-4 grid gap-3">
        {featured.map((item) => (
          <div key={item.title} className="grid grid-cols-[82px_1fr_auto] items-center gap-3 rounded-md border bg-background/80 p-2">
            <div className="relative h-16 overflow-hidden rounded-md bg-muted">
              <Image src={item.image} alt={item.title} fill sizes="82px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.meta}</p>
            </div>
            <p className="text-sm font-semibold">{item.price}</p>
          </div>
        ))}
      </div>
      <Link href="/buy" className="mt-4 inline-flex w-full items-center justify-between rounded-md border bg-background/80 p-3 text-sm font-semibold hover:bg-accent hover:text-accent-foreground">
        Browse marketplace <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/80 p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="mt-2 block text-3xl font-semibold">{value}</span>
    </div>
  );
}
