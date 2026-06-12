"use client";

import { AlertTriangle, Award, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claimCertificate } from "@/lib/actions/admin";

interface ClaimCertificateModalProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullNameAmharic?: string | null;
  };
  studentProfileId: string;
  courseId: string;
  courseTitle: string;
  enrollments?: Array<{
    id: string;
    class?: {
      course?: { id: string; title: string | null } | null;
    } | null;
  }>;
  enrollmentId: string;
  remainingBalance?: number | null;
  initialReceiptNumber?: string | null;
  onClose: () => void;
  redirectPath?: string;
}

export function ClaimCertificateModal({
  student,
  studentProfileId,
  courseId,
  courseTitle,
  enrollments,
  enrollmentId,
  remainingBalance,
  initialReceiptNumber,
  onClose,
  redirectPath = "/admin/certificates",
}: ClaimCertificateModalProps) {
  const router = useRouter();
  const [receiptNumber, setReceiptNumber] = useState(
    initialReceiptNumber ?? ""
  );
  const [manualStudentName, setManualStudentName] = useState(
    `${student.firstName} ${student.lastName}`,
  );
  const [fullNameAmharic, setFullNameAmharic] = useState(
    student.fullNameAmharic ?? "",
  );
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID">(
    "PENDING",
  );
  const [paymentAmount, setPaymentAmount] = useState("500");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const availableCourses = (enrollments ?? [])
    .map((enrollment) => ({
      id: enrollment.class?.course?.id ?? "",
      title: enrollment.class?.course?.title ?? "Unknown course",
    }))
    .filter((course, index, self) =>
      course.id && self.findIndex((c) => c.id === course.id) === index,
    );
  const hasRemaining = remainingBalance && remainingBalance > 0;
  const fullName = manualStudentName;
  const selectedCourseTitle =
    availableCourses.find((course) => course.id === selectedCourseId)?.title ??
    courseTitle;

  async function handleCreate() {
    if (!receiptNumber.trim()) {
      toast.error("Receipt number is required");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("studentId", studentProfileId);
      formData.set("courseId", selectedCourseId);
      formData.set("enrollmentId", enrollmentId);
      formData.set("receiptNumber", receiptNumber.trim());
      formData.set("fullNameAmharic", fullNameAmharic.trim());
      formData.set("manualStudentName", manualStudentName.trim());
      formData.set("paymentStatus", paymentStatus);
      formData.set("paymentAmount", paymentAmount);
      formData.set("paymentMethod", paymentMethod);
      formData.set("notes", notes.trim());

      const res = await claimCertificate(formData);
      if (res.success) {
        toast.success("Certificate created successfully 🎓");
        onClose();
        router.push(redirectPath);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close claim certificate modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <h2 className="font-black text-lg">Claim Certificate</h2>
                <p className="text-white/80 text-xs">{courseTitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {hasRemaining && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <AlertTriangle
                size={18}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Outstanding Balance
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  This student has ETB {remainingBalance!.toLocaleString()}{" "}
                  remaining balance. Certificate can be created but cannot be
                  delivered until payment is complete.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              name="manualStudentName"
              value={manualStudentName}
              onChange={(e) => setManualStudentName(e.target.value)}
              placeholder="Student full name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Full Name in Amharic</Label>
            <Input
              name="fullNameAmharic"
              value={fullNameAmharic}
              onChange={(e) => setFullNameAmharic(e.target.value)}
              placeholder="ሙሉ ስም በአማርኛ"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Course</Label>
            {availableCourses.length > 0 ? (
              <select
                name="courseId"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                readOnly
                value={courseTitle}
                className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Receipt Number <span className="text-red-500">*</span>
            </Label>
            <Input
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g. RCP-2024-001"
              autoFocus={!initialReceiptNumber}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {initialReceiptNumber && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Auto-filled from student payment record — edit if needed
              </p>
            )}
            {!initialReceiptNumber && (
              <p className="text-xs text-gray-400">
                Required — enter the payment receipt number
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Certificate Payment Status</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus("PENDING")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                  paymentStatus === "PENDING"
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                ⏳ Pending
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus("PAID")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                  paymentStatus === "PAID"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                ✅ Paid
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Certificate Payment Amount (ETB)</Label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="500"
              min={0}
            />
            <p className="text-xs text-gray-400">
              Default: ETB 500 — change if different
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_BANKING">Mobile Banking</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t dark:border-gray-700 flex-shrink-0">
          <Button
            onClick={handleCreate}
            disabled={loading || !receiptNumber.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2 disabled:opacity-50"
            size="lg"
          >
            <Award size={16} />
            {loading ? "Creating..." : "Create Certificate"}
          </Button>
          <Button variant="outline" onClick={onClose} size="lg">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
