import Link from "next/link";
import type React from "react";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { toggleVote, toggleWishlist } from "@/lib/actions";
import { safeImageUrl } from "@/lib/image";
import { money, shortDate } from "@/lib/utils";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Vote = { voteType: "LIKE" | "DISLIKE" };

type ProductCardProps = {
  listing: {
    id: string;
    title: string;
    description: string;
    price: unknown;
    category: string;
    condition: string;
    imageUrl: string;
    imageUrls?: string[];
    sponsored?: boolean;
    createdAt: Date;
    seller: { name: string };
    votes?: Vote[];
    wishlistItems?: { id: string }[];
  };
};

export function ProductCard({ listing }: ProductCardProps) {
  const image = safeImageUrl(listing.imageUrls?.[0] || listing.imageUrl);
  const likes = listing.votes?.filter((vote) => vote.voteType === "LIKE").length || 0;
  const dislikes = listing.votes?.filter((vote) => vote.voteType === "DISLIKE").length || 0;
  const wishlisted = !!listing.wishlistItems?.length;

  return (
    <Card className="group h-full overflow-hidden transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-campus">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] bg-muted">
          <img
            src={image}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
          {listing.sponsored && (
            <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
              Sponsored
            </span>
          )}
          <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-sm font-semibold text-foreground shadow-sm">
            {money(String(listing.price))}
          </span>
        </div>
      </Link>
      <CardContent className="flex h-[236px] flex-col gap-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/listings/${listing.id}`} className="line-clamp-2 font-semibold hover:underline">
              {listing.title}
            </Link>
            <p className="mt-1 truncate text-sm text-muted-foreground">Sold by {listing.seller.name}</p>
          </div>
          <Badge variant="mint" className="shrink-0">{listing.condition}</Badge>
        </div>
        <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{listing.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <Badge variant="outline">{listing.category}</Badge>
          <span className="text-xs text-muted-foreground">{shortDate(listing.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span>Student listing</span>
          <div className="flex items-center gap-1">
            <ActionButton listingId={listing.id} name="voteType" value="LIKE" label={`${likes} likes`}>
              <ThumbsUp className="h-3.5 w-3.5" /> {likes}
            </ActionButton>
            <ActionButton listingId={listing.id} name="voteType" value="DISLIKE" label={`${dislikes} dislikes`}>
              <ThumbsDown className="h-3.5 w-3.5" /> {dislikes}
            </ActionButton>
            <form action={toggleWishlist}>
              <input type="hidden" name="listingId" value={listing.id} />
              <PendingSubmitButton size="sm" variant={wishlisted ? "secondary" : "ghost"} aria-label="Toggle wishlist" pendingChildren="Saving">
                <Heart className={wishlisted ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} />
              </PendingSubmitButton>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({
  listingId,
  name,
  value,
  label,
  children
}: {
  listingId: string;
  name: string;
  value: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <form action={toggleVote}>
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name={name} value={value} />
      <PendingSubmitButton size="sm" variant="ghost" aria-label={label} pendingChildren="Saving">
        {children}
      </PendingSubmitButton>
    </form>
  );
}
