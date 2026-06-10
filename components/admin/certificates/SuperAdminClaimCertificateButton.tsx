"use client";

import { Award } from "lucide-react";
import { useState } from "react";
import { ClaimCertificateModal } from "./ClaimCertificateModal";

export function SuperAdminClaimCertificateButton({
  student,
  studentProfileId,
  courseId,
  courseTitle,
  enrollmentId,
  remainingBalance,
  initialReceiptNumber,
  redirectPath,
}: {
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
  initialReceiptNumber?: string | null;
  redirectPath: string;
}) {
  const [showCertModal, setShowCertModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowCertModal(true)}
        className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-amber-500"
        type="button"
      >
        <Award size={13} />
        Claim Certificate
      </button>
      {showCertModal && (
        <ClaimCertificateModal
          student={student}
          studentProfileId={studentProfileId}
          courseId={courseId}
          courseTitle={courseTitle}
          enrollmentId={enrollmentId}
          remainingBalance={remainingBalance}
          initialReceiptNumber={initialReceiptNumber}
          onClose={() => setShowCertModal(false)}
          redirectPath={redirectPath}
        />
      )}
    </>
  );
}
