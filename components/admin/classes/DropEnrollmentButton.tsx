"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { dropEnrollmentFormAction } from "@/lib/actions/admin";

export function DropEnrollmentButton({
  enrollmentId,
}: {
  enrollmentId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDrop() {
    if (!window.confirm("Drop this enrollment?")) return;

    startTransition(async () => {
      await dropEnrollmentFormAction(enrollmentId);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={handleDrop}
    >
      {isPending ? "Dropping..." : "Drop"}
    </Button>
  );
}
