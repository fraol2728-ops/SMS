"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claimCertificate } from "@/lib/actions/admin";
export function ClaimCertificateModal({
  studentId,
  studentName,
  courseName,
  hasRemaining,
  remainingAmount,
  className,
}: {
  studentId: string;
  studentName: string;
  courseName: string;
  hasRemaining: boolean;
  remainingAmount: number;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  async function handleClaim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await claimCertificate(
        studentId,
        new FormData(e.currentTarget),
      );
      if (res.success) {
        toast.success("Certificate claimed successfully");
        setOpen(false);
        router.push("/admin/certificates");
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  if (!open)
    return (
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "h-10 w-full bg-yellow-500 text-white hover:bg-yellow-600",
          className,
        )}
      >
        🎓 Claim Certificate
      </Button>
    );
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-1">🎓 Claim Certificate</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Processing certificate for <strong>{studentName}</strong>
        </p>
        {hasRemaining && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ Remaining Balance: ETB {remainingAmount.toLocaleString()}
            </p>
          </div>
        )}
        <form onSubmit={handleClaim} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input name="fullName" defaultValue={studentName} required />
          </div>
          <div>
            <Label>Course</Label>
            <Input
              name="courseName"
              defaultValue={courseName}
              readOnly
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label>Certificate Payment Status *</Label>
            <select
              name="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          {paymentStatus === "PAID" && (
            <div>
              <Label>Payment Method *</Label>
              <select
                name="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          )}
          <div>
            <Label>Notes (optional)</Label>
            <Input name="notes" placeholder="Any notes..." />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Claim Certificate"}
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
