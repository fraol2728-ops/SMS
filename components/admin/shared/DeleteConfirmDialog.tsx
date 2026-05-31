"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DeleteConfirmDialogProps = {
  label: string;
  dialogTitle: string;
  dialogDescription: string;
  endpoint: string;
  payload: Record<string, string>;
  successRedirect: string;
};

export function DeleteConfirmDialog({
  label,
  dialogTitle,
  dialogDescription,
  endpoint,
  payload,
  successRedirect,
}: DeleteConfirmDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        toast.error(data.error || "Failed to delete.");
        return;
      }
      toast.success(`${label} deleted successfully`);
      router.push(successRedirect);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        {label}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{dialogTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {dialogDescription}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Deleting..." : `Confirm delete`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
