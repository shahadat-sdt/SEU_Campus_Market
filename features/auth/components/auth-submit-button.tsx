"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { startGlobalProgress, stopGlobalProgress } from "@/shared/components/layout/navigation-progress";
import { Button } from "@/shared/components/ui/button";

type AuthSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

export function AuthSubmitButton({ idleLabel, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) {
      startGlobalProgress();
      return;
    }
    stopGlobalProgress();
  }, [pending]);

  return (
    <Button type="submit" className="w-full" disabled={pending} aria-disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
