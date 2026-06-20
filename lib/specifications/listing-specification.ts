import type { Listing, ListingStatus } from "@prisma/client";
import { listingCategories, listingConditions } from "@/lib/constants";

export type ListingPayload = {
  title: string;
  description: string;
  category: string;
  condition: string;
  imageUrl: string;
  price: number;
};

function isHttpsUrl(input: string) {
  try {
    const url = new URL(input);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidListingPayload(payload: ListingPayload) {
  return (
    Boolean(payload.title) &&
    payload.title.length <= 60 &&
    Boolean(payload.description) &&
    payload.description.length <= 300 &&
    listingCategories.includes(payload.category as never) &&
    listingConditions.includes(payload.condition as never) &&
    isHttpsUrl(payload.imageUrl) &&
    Number.isFinite(payload.price) &&
    payload.price > 0
  );
}

export function canManageListing(userId: string, listing: Pick<Listing, "sellerId"> | null) {
  return Boolean(listing && listing.sellerId === userId);
}

export function isValidListingStatus(status: string): status is ListingStatus {
  return status === "ACTIVE" || status === "SOLD" || status === "HIDDEN" || status === "DRAFT";
}

export function shouldArchiveListing(orderCount: number) {
  return orderCount > 0;
}
