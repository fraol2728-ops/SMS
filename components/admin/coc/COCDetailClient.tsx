"use client";

import { Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCOCStudent } from "@/lib/actions/coc";

export function COCDetailClient({ student }: { student: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(student.paymentStatus);
  const [result, setResult] = useState(student.result ?? "");
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateCOCStudent(
        student.id,
        new FormData(e.currentTarget),
      );
      if (res.success) {
        toast.success("Updated successfully");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { label: "Full Name", value: student.fullName },
            { label: "Gender", value: student.gender ?? "—" },
            { label: "Reg No", value: student.regNo ?? "—" },
            { label: "Campus", value: student.campus?.name ?? "—" },
            {
              label: "Added",
              value: new Date(student.createdAt).toLocaleDateString("en-GB"),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="font-medium text-sm dark:text-white">{value}</p>
            </div>
          ))}
        </div>
        {student.phone && (
          <button
            onClick={() => window.open(`tel:${student.phone}`, "_self")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg"
          >
            <Phone size={12} /> Call {student.phone}
          </button>
        )}
        {student.studentProfile && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 mt-4 text-xs text-blue-600">
            Linked to enrolled student: {student.studentProfile.user.firstName}{" "}
            {student.studentProfile.user.lastName}
          </div>
        )}
      </div>
      <form
        onSubmit={handleUpdate}
        className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6 space-y-4"
      >
        <h2 className="font-semibold dark:text-white">Update Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Payment Status</Label>
            <select
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
              <Label>Payment Method</Label>
              <select
                name="paymentMethod"
                defaultValue={student.paymentMethod ?? "CASH"}
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
            <Label>Exam Result</Label>
            <select
              name="result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
            >
              <option value="">Pending</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Exam Date</Label>
            <input
              name="examDate"
              type="date"
              defaultValue={
                student.examDate
                  ? new Date(student.examDate).toISOString().slice(0, 10)
                  : ""
              }
              className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              name="notes"
              defaultValue={student.notes ?? ""}
              rows={2}
            />
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
