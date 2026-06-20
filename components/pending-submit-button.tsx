"use client";

import type React from "react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { startGlobalProgress, stopGlobalProgress } from "@/components/navigation-progress";
import { Button, type ButtonProps } from "@/components/ui/button";

type PendingSubmitButtonProps = ButtonProps & {
  children: React.ReactNode;
  pendingChildren?: React.ReactNode;
};

export function PendingSubmitButton({
  children,
  pendingChildren,
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) {
      startGlobalProgress();
      return;
    }
    stopGlobalProgress();
  }, [pending]);

  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} {...props}>
      {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> {pendingChildren || "Processing"}</> : children}
    </Button>
  );
}
