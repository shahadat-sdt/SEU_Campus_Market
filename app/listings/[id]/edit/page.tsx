import { notFound, redirect } from "next/navigation";
import { updateListing } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { categories } from "@/lib/constants";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
  if (listing.sellerId !== user.id) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
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
              Please fill every required field and keep the price above zero.
            </p>
          )}
          <form action={updateListing} className="grid gap-4">
            <input type="hidden" name="listingId" value={listing.id} />
            <Input name="title" defaultValue={listing.title} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="price"
                type="number"
                min="1"
                step="1"
                defaultValue={listing.price.toString()}
                required
              />
              <Select name="category" required defaultValue={listing.category}>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </div>
            <Input name="imageUrl" type="url" defaultValue={listing.imageUrl} required />
            <Textarea name="description" defaultValue={listing.description} required />
            <Button>Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
