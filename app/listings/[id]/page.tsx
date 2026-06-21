import { notFound } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/auth";
import { marketplaceApi } from "@/features/marketplace/api/marketplace-api";
import { ListingDetail } from "@/features/listings/components/listing-detail";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ListingPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  const listing = await marketplaceApi.listingDetail(id, user?.id);

  if (!listing) notFound();
  if (listing.status !== "ACTIVE" && user?.id !== listing.sellerId) notFound();

  return <ListingDetail listing={listing} user={user} stockError={query.error === "stock"} />;
}
