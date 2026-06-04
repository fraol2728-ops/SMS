"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createManualCertificate } from "@/lib/actions/admin";

export function ManualCertificateForm({
  courses,
  redirectTo = "/admin/certificates",
}: {
  courses: any[];
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createManualCertificate(new FormData(e.currentTarget));
      if (res.success) {
        toast.success("Certificate added");
        router.push(redirectTo);
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6 space-y-4"
    >
      <div className="space-y-1.5">
        <Label>Student Full Name *</Label>
        <Input name="studentName" required placeholder="Full name" />
      </div>
      <div className="space-y-1.5">
        <Label>Course *</Label>
        <select
          name="courseId"
          required
          className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Payment Status</Label>
        <select
          name="paymentStatus"
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
        >
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>
      {paymentStatus === "PAID" && (
        <div className="space-y-1.5">
          <Label>Payment Method</Label>
          <select
            name="paymentMethod"
            className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CARD">Card</option>
          </select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Input name="notes" placeholder="Any notes..." />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Certificate"}
      </Button>
    </form>
  );
}
