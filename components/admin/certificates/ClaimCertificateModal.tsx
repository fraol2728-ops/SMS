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
  enrollmentId: string;
  remainingBalance?: number | null;
  onClose: () => void;
  redirectPath?: string;
}

export function ClaimCertificateModal({
  student,
  studentProfileId,
  courseId,
  courseTitle,
  enrollmentId,
  remainingBalance,
  onClose,
  redirectPath = "/admin/certificates",
}: ClaimCertificateModalProps) {
  const router = useRouter();
  const [receiptNumber, setReceiptNumber] = useState("");
  const [fullNameAmharic, setFullNameAmharic] = useState(
    student.fullNameAmharic ?? "",
  );
  const [loading, setLoading] = useState(false);

  const hasRemaining = !!remainingBalance && remainingBalance > 0;
  const fullName = `${student.firstName} ${student.lastName}`;

  async function handleCreate() {
    if (!receiptNumber.trim()) {
      toast.error("Receipt number is required");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("studentId", studentProfileId);
      formData.set("courseId", courseId);
      formData.set("enrollmentId", enrollmentId);
      formData.set("receiptNumber", receiptNumber.trim());
      formData.set("fullNameAmharic", fullNameAmharic.trim());
      formData.set("manualStudentName", fullName);

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
        aria-label="Close claim certificate modal"
      />
      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl duration-200 animate-in zoom-in-95 dark:bg-gray-900">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Award size={20} />
              </div>
              <div>
                <h2 className="font-black text-lg">Claim Certificate</h2>
                <p className="text-white/80 text-xs">{courseTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 transition-colors hover:bg-white/20"
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {hasRemaining && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertTriangle
                size={18}
                className="mt-0.5 flex-shrink-0 text-amber-600"
              />
              <div>
                <p className="font-bold text-amber-800 text-sm dark:text-amber-300">
                  Outstanding Balance
                </p>
                <p className="mt-0.5 text-amber-700 text-xs dark:text-amber-400">
                  This student has ETB {remainingBalance.toLocaleString()}{" "}
                  remaining balance. Certificate can be created but cannot be
                  delivered until payment is complete.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              value={fullName}
              readOnly
              className="cursor-not-allowed bg-gray-50 font-semibold dark:bg-gray-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Full Name in Amharic</Label>
            <Input
              value={fullNameAmharic}
              onChange={(e) => setFullNameAmharic(e.target.value)}
              placeholder="ሙሉ ስም በአማርኛ"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Course</Label>
            <Input
              value={courseTitle}
              readOnly
              className="cursor-not-allowed bg-gray-50 dark:bg-gray-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receiptNumber">
              Receipt Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="receiptNumber"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g. RCP-2024-001"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <p className="text-gray-400 text-xs">
              Required — enter the payment receipt number
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleCreate}
              disabled={loading || !receiptNumber.trim()}
              className="flex-1 gap-2 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
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
    </div>
  );
}
