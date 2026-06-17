import { createListing } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { ListingForm } from "@/components/listing-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewListingPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Card className="shadow-campus">
        <CardHeader>
          <CardTitle>Post a listing</CardTitle>
          <CardDescription>
            Add the details buyers need, upload photos, then preview before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Please complete every required field, upload at least one photo, and keep title/description within the limits.
            </p>
          )}
          <ListingForm action={createListing} />
        </CardContent>
      </Card>
    </main>
  );
}
