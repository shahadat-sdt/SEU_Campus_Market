import Link from "next/link";
import { register } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-md place-items-center px-4 py-10">
      <Card className="w-full shadow-campus">
        <CardHeader>
          <CardTitle>Create student account</CardTitle>
          <CardDescription>Use an official SEU email address for campus verification.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error === "email"
                ? "Please use an SEU email address."
                : error === "exists"
                  ? "An account already exists with this email."
                  : "Please complete every field. Password needs 6+ characters."}
            </p>
          )}
          <form action={register} className="space-y-4">
            <Input name="name" placeholder="Full name" required />
            <Input name="email" type="email" placeholder="name@seu.edu.bd" required />
            <Input name="password" type="password" placeholder="Password" minLength={6} required />
            <Button className="w-full">Register</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already joined? <Link href="/login" className="font-medium text-primary underline">Login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
