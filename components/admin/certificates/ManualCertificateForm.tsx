"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createManualCertificate } from "@/lib/actions/admin";

export function ManualCertificateForm({
  courses,
  studentData,
  redirectTo = "/admin/certificates",
}: {
  courses: any[];
  studentData?: any;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [selectedCourseId, setSelectedCourseId] = useState(
    studentData?.enrollments?.[0]?.courseId || "",
  );

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

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-6 space-y-4"
    >
      {studentData?.remaining && studentData.remaining.remainingAmount > 0 && (
        <div className="flex gap-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Outstanding Payment
            </p>
            <p className="mt-1 text-amber-800 dark:text-amber-300">
              This student has ETB {studentData.remaining.remainingAmount.toLocaleString()} remaining balance.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="studentName">Student Full Name *</Label>
        <Input
          id="studentName"
          name="studentName"
          required
          placeholder="Full name"
          defaultValue={
            studentData
              ? `${studentData.firstName} ${studentData.lastName}`
              : ""
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullNameAmharic">Full Name in Amharic</Label>
        <Input
          id="fullNameAmharic"
          name="fullNameAmharic"
          placeholder="ሙሉ ስም በአማርኛ"
        />
        <p className="text-xs text-gray-400">
          Optional — used for the printed certificate
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>Course *</Label>
        <select
          name="courseId"
          required
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="h-10 w-full rounded-lg border bg-background dark:bg-gray-800 dark:border-gray-600 px-3 text-sm"
        >
          <option value="">Select course</option>
          {studentData?.enrollments && studentData.enrollments.length > 0 ? (
            <>
              <optgroup label="Student's Courses">
                {studentData.enrollments.map((e: any) => (
                  <option key={e.id} value={e.courseId}>
                    {e.courseTitle}
                  </option>
                ))}
              </optgroup>
              {courses.some(
                (c) =>
                  !studentData.enrollments.find((e: any) => e.courseId === c.id),
              ) && (
                <optgroup label="Other Courses">
                  {courses
                    .filter(
                      (c) =>
                        !studentData.enrollments.find(
                          (e: any) => e.courseId === c.id,
                        ),
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                </optgroup>
              )}
            </>
          ) : (
            courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))
          )}
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
