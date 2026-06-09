"use client";

import { UserMinus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { withdrawStudent } from "@/lib/actions/admin";

export function WithdrawButton({
  enrollmentId,
  studentName,
}: {
  enrollmentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    reason: "",
    expectedReturnDate: "",
    contactDuring: "",
    notes: "",
  });

  async function handleWithdraw() {
    if (!form.reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("enrollmentId", enrollmentId);
      formData.set("reason", form.reason.trim());
      formData.set("expectedReturnDate", form.expectedReturnDate);
      formData.set("contactDuring", form.contactDuring.trim());
      formData.set("notes", form.notes.trim());
      const res = await withdrawStudent(formData);
      if (res.success) {
        toast.success("Student withdrawn successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-amber-600"
        type="button"
      >
        <UserMinus size={13} />
        Withdraw
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close withdrawal modal"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-4 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-lg dark:text-white">
                Withdraw Student
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-5 text-gray-500 text-sm dark:text-gray-400">
              Withdrawing{" "}
              <span className="font-semibold dark:text-white">
                {studentName}
              </span>
              . They can be re-enrolled later from the Withdrawn page.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Reason for Withdrawal *</Label>
                <Input
                  value={form.reason}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="e.g. Personal reasons, travel, medical..."
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label>Expected Return Date (optional)</Label>
                <input
                  type="date"
                  value={form.expectedReturnDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      expectedReturnDate: event.target.value,
                    }))
                  }
                  min={new Date().toISOString().slice(0, 10)}
                  className="h-10 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Contact During Absence (optional)</Label>
                <Input
                  value={form.contactDuring}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contactDuring: event.target.value,
                    }))
                  }
                  placeholder="Phone or email to reach student..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Additional Notes (optional)</Label>
                <Input
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Any other important information..."
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleWithdraw}
                disabled={loading || !form.reason.trim()}
                className="flex-1 rounded-2xl bg-amber-500 py-3 font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                type="button"
              >
                {loading ? "Withdrawing..." : "Confirm Withdrawal"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-gray-100 px-5 py-3 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
