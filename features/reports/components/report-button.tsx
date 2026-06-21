"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function ReportButton({
  productId,
  reporterId,
  reason = "Suspicious listing",
  size = "sm"
}: {
  productId: string;
  reporterId: string;
  reason?: string;
  size?: "sm" | "default";
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={isPending}
        onClick={() => {
          setMessage("");
          startTransition(async () => {
            const response = await fetch("/api/reports", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                productId,
                reporterId,
                reason,
                timestamp: new Date().toISOString()
              })
            });
            const payload = await response.json();
            setMessage(payload.message || payload.error || "Report submitted. We'll review it shortly.");
          });
        }}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} Report
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
