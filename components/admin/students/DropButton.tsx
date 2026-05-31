"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dropStudent } from "@/lib/actions/admin";
export function DropButton({
  enrollmentId,
  studentName,
}: {
  enrollmentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  async function handleDrop(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await dropStudent(enrollmentId, reason);
      if (res.success) {
        toast.success("Student dropped");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  if (!open)
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-red-300 text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        Drop
      </Button>
    );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-1 text-red-700">
          Drop Student
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          This will mark <strong>{studentName}</strong> as dropped.
        </p>
        <form onSubmit={handleDrop} className="space-y-4">
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why is this student being dropped?"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? "Dropping..." : "Confirm Drop"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
