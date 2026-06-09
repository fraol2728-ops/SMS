"use client";

import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle,
  Copy,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { markCertificateDelivered } from "@/lib/actions/admin";

type CertificateDetail = {
  id: string;
  manualStudentName?: string | null;
  fullNameAmharic?: string | null;
  receiptNumber?: string | null;
  issuedAt: Date | string;
  paymentStatus: string;
  isDelivered: boolean;
  deliveredAt?: Date | string | null;
  student?: { user: { firstName: string; lastName: string } } | null;
  course?: { title: string } | null;
};

export function CertificateDetailClient({
  cert,
  studentRemaining,
}: {
  cert: CertificateDetail;
  studentRemaining: { remainingAmount: number; dueDate: Date | null } | null;
}) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBlockedWarning, setShowBlockedWarning] = useState(false);

  const remainingAmount = studentRemaining?.remainingAmount ?? 0;
  const hasRemaining = remainingAmount > 0;

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2500);
  }

  async function handleMarkDelivered() {
    if (hasRemaining) {
      setShowBlockedWarning(true);
      return;
    }
    setLoading(true);
    try {
      const res = await markCertificateDelivered(cert.id);
      if (res.success) {
        toast.success("Certificate marked as delivered 🎓");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  const studentName =
    cert.manualStudentName ??
    (cert.student
      ? `${cert.student.user.firstName} ${cert.student.user.lastName}`
      : "—");

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium text-xs transition-all ${
        copiedField === field
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "border bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
      }`}
      type="button"
    >
      {copiedField === field ? (
        <>
          <Check size={12} />
          Copied!
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy
        </>
      )}
    </button>
  );

  return (
    <div className="max-w-2xl space-y-5">
      {showBlockedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBlockedWarning(false)}
            type="button"
            aria-label="Close blocked delivery warning"
          />
          <div className="relative mx-4 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl duration-200 animate-in zoom-in-95 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <button
                onClick={() => setShowBlockedWarning(false)}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="mb-2 font-black text-gray-900 text-lg dark:text-white">
              Cannot Deliver Certificate
            </h3>
            <p className="mb-2 text-gray-600 text-sm dark:text-gray-400">
              This student has an outstanding balance of{" "}
              <span className="font-black text-red-600">
                ETB {remainingAmount.toLocaleString()}
              </span>
              .
            </p>
            <p className="mb-5 text-gray-500 text-sm dark:text-gray-500">
              Please collect the remaining payment before delivering the
              certificate.
            </p>
            <button
              onClick={() => setShowBlockedWarning(false)}
              className="w-full rounded-2xl bg-gray-900 py-3 font-semibold text-sm text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-gray-900"
              type="button"
            >
              Understood
            </button>
          </div>
        </div>
      )}

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
            <p className="mt-0.5 text-amber-700 text-sm dark:text-amber-400">
              This student has{" "}
              <span className="font-black">
                ETB {remainingAmount.toLocaleString()}
              </span>{" "}
              remaining. Certificate cannot be delivered until payment is
              complete.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div
          className={`p-5 text-white ${
            cert.isDelivered
              ? "bg-gradient-to-r from-green-500 to-teal-500"
              : "bg-gradient-to-r from-amber-400 to-orange-500"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                {cert.isDelivered ? (
                  <CheckCircle size={16} />
                ) : (
                  <Award size={16} />
                )}
                <p className="font-bold text-sm">
                  {cert.isDelivered
                    ? "Certificate Delivered ✓"
                    : "Certificate Issued — Pending Delivery"}
                </p>
              </div>
              {cert.deliveredAt && (
                <p className="mt-0.5 text-white/80 text-xs">
                  Delivered on{" "}
                  {new Date(cert.deliveredAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="mb-2 font-semibold text-gray-400 text-xs uppercase tracking-wide">
              Full Name
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-gray-900 text-lg leading-tight dark:text-white">
                {studentName}
              </p>
              <CopyButton text={studentName} field="Full Name" />
            </div>
          </div>

          {cert.fullNameAmharic && (
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
              <p className="mb-2 font-semibold text-gray-400 text-xs uppercase tracking-wide">
                Full Name in Amharic
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-gray-900 text-lg leading-tight dark:text-white">
                  {cert.fullNameAmharic}
                </p>
                <CopyButton text={cert.fullNameAmharic} field="Amharic Name" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Course", value: cert.course?.title ?? "—" },
              { label: "Receipt Number", value: cert.receiptNumber ?? "—" },
              {
                label: "Issued",
                value: new Date(cert.issuedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
              },
              { label: "Payment Status", value: cert.paymentStatus },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl bg-gray-50 p-3 dark:bg-gray-800"
              >
                <p className="mb-1 text-gray-400 text-xs">{label}</p>
                <p className="font-semibold text-gray-900 text-sm dark:text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {!cert.isDelivered && (
            <div className="pt-2">
              <button
                onClick={handleMarkDelivered}
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm transition-all ${
                  hasRemaining
                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    : "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md hover:from-green-600 hover:to-teal-600 hover:shadow-lg"
                }`}
                type="button"
              >
                {loading ? (
                  "Marking..."
                ) : hasRemaining ? (
                  <>
                    <AlertTriangle size={15} />
                    Cannot Deliver — Outstanding Balance
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    Mark as Delivered
                  </>
                )}
              </button>
              {hasRemaining && (
                <p className="mt-2 text-center text-gray-400 text-xs">
                  Collect payment first, then you can deliver the certificate
                </p>
              )}
            </div>
          )}

          {cert.isDelivered && (
            <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/20">
              <CheckCircle size={20} className="flex-shrink-0 text-green-600" />
              <div>
                <p className="font-bold text-green-800 text-sm dark:text-green-300">
                  Certificate Successfully Delivered
                </p>
                <p className="mt-0.5 text-green-600 text-xs dark:text-green-400">
                  {cert.deliveredAt
                    ? `Delivered on ${new Date(cert.deliveredAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`
                    : "Delivery recorded"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
