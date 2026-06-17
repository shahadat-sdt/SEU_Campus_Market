"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ListingError() {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-10">
      <Card className="w-full shadow-campus">
        <CardContent className="space-y-4 pt-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We could not load this product safely. Try again or return to the marketplace.
          </p>
          <Button asChild><Link href="/">Back to marketplace</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
