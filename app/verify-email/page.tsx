import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  let verified = false;

  if (token) {
    const user = await db.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
          emailVerificationToken: null,
          emailVerificationExpires: null
        }
      });
      verified = true;
    }
  }

  return (
    <main className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-10">
      <Card className="w-full shadow-campus">
        <CardContent className="space-y-4 pt-6 text-center">
          {verified ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          ) : (
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
          )}
          <h1 className="text-2xl font-semibold">{verified ? "Email verified" : "Verification link expired"}</h1>
          <p className="text-sm text-muted-foreground">
            {verified
              ? "You can now post listings and place orders on SEU Campus Market."
              : "Request a fresh verification email from your selling page."}
          </p>
          <Button asChild><Link href="/sell">Go to selling</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
