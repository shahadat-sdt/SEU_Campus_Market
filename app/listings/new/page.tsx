import { createListing } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { categories } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewListingPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card className="shadow-campus">
        <CardHeader>
          <CardTitle>Post a listing</CardTitle>
          <CardDescription>
            Keep it simple: title, real photo URL, category, price, and a useful description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Please fill every required field and add a real HTTPS photo URL.
            </p>
          )}
          <form action={createListing} className="grid gap-4">
            <Input name="title" placeholder="Example: Handmade churi set" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="price" type="number" min="1" step="1" placeholder="Price in BDT" required />
              <Select name="category" required defaultValue="">
                <option value="" disabled>Choose category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </div>
            <Input
              name="imageUrl"
              type="url"
              placeholder="HTTPS photo URL, e.g. https://images.unsplash.com/..."
              required
            />
            <Textarea
              name="description"
              placeholder="Condition, size, delivery notes, pickup timing, or anything buyers should know"
              required
            />
            <Button>Publish listing</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
