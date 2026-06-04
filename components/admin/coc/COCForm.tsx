"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addCOCStudentFromProfile,
  addCOCStudentManual,
} from "@/lib/actions/coc";

export function COCForm({
  defaultValues,
  studentProfileId,
  onSuccess,
  redirectTo = "/admin/coc",
}: {
  defaultValues?: Partial<{
    fullName: string;
    gender: string;
    phone: string;
    regNo: string;
  }>;
  studentProfileId?: string;
  onSuccess?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = studentProfileId
        ? await addCOCStudentFromProfile(studentProfileId, formData)
        : await addCOCStudentManual(formData);
      if (res.success) {
        toast.success("Student added to COC list");
        onSuccess ? onSuccess() : router.push(redirectTo);
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6 space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            defaultValue={defaultValues?.fullName}
            placeholder="Student full name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            name="gender"
            defaultValue={defaultValues?.gender ?? ""}
            className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={defaultValues?.phone}
            placeholder="Phone number"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="regNo">Registration No (optional)</Label>
          <Input
            id="regNo"
            name="regNo"
            defaultValue={defaultValues?.regNo}
            placeholder="e.g. COC-2026-001"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="examDate">Exam Date (optional)</Label>
          <input
            id="examDate"
            name="examDate"
            type="date"
            className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paymentAmount">Payment Amount (ETB) *</Label>
          <Input
            id="paymentAmount"
            name="paymentAmount"
            type="number"
            min={0}
            required
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paymentStatus">Payment Status *</Label>
          <select
            id="paymentStatus"
            name="paymentStatus"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
          >
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        {paymentStatus === "PAID" && (
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <select
              id="paymentMethod"
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
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Any additional notes..."
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add to COC List"}
      </Button>
    </form>
  );
}
