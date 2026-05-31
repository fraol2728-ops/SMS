"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { withdrawStudent } from "@/lib/actions/admin";

export function WithdrawModal({
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
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }
    setLoading(true);
    try {
      const res = await withdrawStudent(
        enrollmentId,
        reason,
        returnDate || null,
        notes || null,
      );
      if (res.success) {
        toast.success("Student withdrawn successfully");
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
        className="border-amber-300 text-amber-700 hover:bg-amber-50"
        onClick={() => setOpen(true)}
      >
        Withdraw
      </Button>
    );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-1">Withdraw Student</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {studentName} will be put on hold temporarily.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={2}
              placeholder="Why is the student withdrawing?"
            />
          </div>
          <div className="space-y-2">
            <Label>Expected Return Date (optional)</Label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Confirm Withdrawal"}
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
