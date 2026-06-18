import { notFound, redirect } from "next/navigation";
import { updateListing } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { ListingForm } from "@/components/listing-form";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EditListingPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const { id } = await params;
  const paramsValue = await searchParams;
  const error = Array.isArray(paramsValue.error) ? paramsValue.error[0] : paramsValue.error;

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (listing.sellerId !== user.id) redirect("/sell");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Card className="shadow-campus">
        <CardHeader>
          <CardTitle>Edit listing</CardTitle>
          <CardDescription>
            Update the public details buyers see in the campus feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Please fill every required field, use an HTTPS photo URL, and keep the price above zero.
            </p>
          )}
          <ListingForm
            action={updateListing}
            listingId={listing.id}
            initial={{
              title: listing.title,
              description: listing.description,
              category: listing.category,
              condition: listing.condition,
              quantity: listing.quantity,
              price: listing.price.toString(),
              imageUrls: listing.imageUrls.length ? listing.imageUrls : [listing.imageUrl],
              tags: listing.tags,
              negotiable: listing.negotiable,
              campusPickup: listing.campusPickup,
              whatsappContact: listing.whatsappContact,
              deliveryAvailable: listing.deliveryAvailable
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
