import { verifyAccount } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const registered = Boolean(params.registered);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-md place-items-center px-4 py-10">
      <Card className="w-full shadow-campus">
        <CardHeader>
          <CardTitle>Verify your SEU account</CardTitle>
          <CardDescription>
            For this ISD demo, the email confirmation token is shown here instead of being sent by SMTP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error === "invalid" && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Verification token is invalid or already used.
            </p>
          )}
          {registered && token && (
            <p className="mb-4 rounded-md border bg-secondary p-3 text-sm">
              Demo verification token: <span className="font-mono">{token}</span>
            </p>
          )}
          <form action={verifyAccount} className="space-y-4">
            <Input name="token" defaultValue={token || ""} placeholder="Verification token" required />
            <Button className="w-full">Verify and enter market</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
