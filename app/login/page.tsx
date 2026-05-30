import Link from "next/link";
import { login } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-md place-items-center px-4 py-10">
      <Card className="w-full shadow-campus">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Login to browse, order, sell, and manage handovers.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Invalid email or password.
            </p>
          )}
          <form action={login} className="space-y-4">
            <Input name="email" type="email" placeholder="2024000000001@seu.edu.bd" required />
            <Input name="password" type="password" placeholder="Password" required />
            <Button className="w-full">Login</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here? <Link href="/register" className="font-medium text-primary underline">Create account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
