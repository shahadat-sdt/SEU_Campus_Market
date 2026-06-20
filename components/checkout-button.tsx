"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { startGlobalProgress, stopGlobalProgress } from "@/components/navigation-progress";
import { Button } from "@/components/ui/button";

export function CheckoutButton({ orderId }: { orderId: string }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError("");
          startGlobalProgress();
          startTransition(async () => {
            try {
              const response = await fetch("/api/payments/sslcommerz", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ orderId })
              });
              const payload = await response.json();
              if (!response.ok) {
                setError(payload.error || "Could not start checkout.");
                stopGlobalProgress();
                return;
              }
              window.location.href = payload.gatewayUrl;
            } catch {
              setError("Could not start checkout.");
              stopGlobalProgress();
            }
          });
        }}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Checkout
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
