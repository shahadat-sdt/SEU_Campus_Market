import Link from "next/link";
import { register } from "@/lib/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";
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
          <CardDescription>Use your 13-digit SEU student email to join the campus marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error === "email"
                ? "Please use your 13-digit SEU email, for example 2024000000001@seu.edu.bd."
                : error === "exists"
                  ? "An account already exists with this email."
                  : "Please complete every field. Password needs 6+ characters."}
            </p>
          )}
          <form action={register} className="space-y-4">
            <Input name="name" placeholder="Full name" required />
            <Input name="email" type="email" placeholder="2024000000001@seu.edu.bd" required />
            <Input name="password" type="password" placeholder="Password" minLength={6} required />
            <AuthSubmitButton idleLabel="Register" pendingLabel="Creating account..." />
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already joined? <Link href="/login" className="font-medium text-primary underline">Login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
