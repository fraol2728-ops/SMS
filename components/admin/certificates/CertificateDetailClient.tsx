"use client";

import { CheckCircle, Clock, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  markCertificateAsDone,
  markCertificateDelivered,
  unmarkCertificateAsDone,
  updateCertificatePayment,
} from "@/lib/actions/admin";

type CertificateDetailCert = {
  id: string;
  manualStudentName?: string | null;
  fullNameAmharic?: string | null;
  student?: { user: { firstName: string; lastName: string } } | null;
  course?: { title: string } | null;
  issuedAt: Date | string;
  paymentStatus: string;
  paymentMethod?: string | null;
  isDone: boolean;
  doneAt?: Date | string | null;
  isDelivered: boolean;
  deliveredAt?: Date | string | null;
  notes?: string | null;
};

export function CertificateDetailClient({
  cert,
  studentRemaining,
  redirectTo = "/admin/certificates",
}: {
  cert: CertificateDetailCert;
  studentRemaining?: { remainingAmount: number; dueDate: Date | null } | null;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState(cert.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState(
    cert.paymentMethod ?? "CASH",
  );
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [doneLoading, setDoneLoading] = useState(false);
  const [deliverLoading, setDeliverLoading] = useState(false);

  async function handleMarkDone() {
    if (!confirm("Mark this certificate as done/ready?")) return;
    setDoneLoading(true);
    try {
      const res = await markCertificateAsDone(cert.id);
      if (res.success) {
        toast.success("Certificate marked as done ✓");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setDoneLoading(false);
    }
  }

  async function handleUnmark() {
    if (!confirm("Remove done status from this certificate?")) return;
    setDoneLoading(true);
    try {
      const res = await unmarkCertificateAsDone(cert.id);
      if (res.success) {
        toast.success("Certificate status updated");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setDoneLoading(false);
    }
  }

  async function handleUpdatePayment() {
    setPaymentLoading(true);
    try {
      const res = await updateCertificatePayment(
        cert.id,
        paymentStatus,
        paymentMethod,
      );
      if (res.success) {
        toast.success("Payment updated");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleDeliver() {
    if (
      !confirm(
        "Mark this certificate as delivered? This will remove it from the list.",
      )
    )
      return;
    setDeliverLoading(true);
    try {
      const res = await markCertificateDelivered(cert.id);
      if (res.success) {
        toast.success("Certificate marked as delivered");
        router.push(redirectTo);
      } else {
        toast.error(res.error);
      }
    } finally {
      setDeliverLoading(false);
    }
  }

  const studentName =
    cert.manualStudentName ??
    (cert.student
      ? `${cert.student.user.firstName} ${cert.student.user.lastName}`
      : "—");

  return (
    <div className="space-y-5">
      <div
        className={`rounded-3xl p-6 text-white ${
          cert.isDone
            ? "bg-gradient-to-r from-green-500 to-teal-500"
            : cert.isDelivered
              ? "bg-gradient-to-r from-blue-500 to-indigo-500"
              : cert.paymentStatus === "PAID"
                ? "bg-gradient-to-r from-amber-400 to-orange-500"
                : "bg-gradient-to-r from-gray-500 to-gray-600"
        }`}
      >
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl">
            🎓
          </div>
          <div>
            <p className="font-black text-xl">{studentName}</p>
            <p className="text-sm text-white/80">{cert.course?.title}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {cert.isDone ? (
            <span className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 font-bold text-sm">
              <CheckCircle size={14} /> Certificate Done ✓
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 font-medium text-sm">
              <Clock size={14} /> Not Done Yet
            </span>
          )}
          {cert.isDelivered && (
            <span className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 font-medium text-sm">
              <Package size={14} /> Delivered
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 font-medium text-sm">
            Payment: {cert.paymentStatus}
          </span>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="font-bold text-gray-900 dark:text-white">
          Certificate Details
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: "Student Name", value: studentName },
            {
              label: "Full Name in Amharic",
              value: cert.fullNameAmharic ?? "—",
            },
            { label: "Course", value: cert.course?.title ?? "—" },
            { label: "Payment Status", value: cert.paymentStatus },
            {
              label: "Issued",
              value: new Date(cert.issuedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            },
            {
              label: "Done Date",
              value: cert.doneAt
                ? new Date(cert.doneAt).toLocaleDateString("en-GB")
                : "—",
            },
            {
              label: "Delivered",
              value:
                cert.isDelivered && cert.deliveredAt
                  ? new Date(cert.deliveredAt).toLocaleDateString("en-GB")
                  : "—",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-gray-50 p-3 dark:bg-gray-800"
            >
              <p className="mb-1 text-gray-400 text-xs">{label}</p>
              <p className="font-semibold text-sm dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {studentRemaining && studentRemaining.remainingAmount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="font-bold text-amber-800 text-sm dark:text-amber-300">
            ⚠️ Outstanding Balance
          </p>
          <p className="mt-1 text-amber-700 text-sm dark:text-amber-400">
            This student has an outstanding balance of{" "}
            <span className="font-black">
              ETB {studentRemaining.remainingAmount.toLocaleString()}
            </span>
          </p>
          {studentRemaining.dueDate && (
            <p className="mt-1 text-amber-600 text-xs">
              Due:{" "}
              {new Date(studentRemaining.dueDate).toLocaleDateString("en-GB")}
            </p>
          )}
        </div>
      )}

      <div className="rounded-3xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-2 font-bold text-gray-900 dark:text-white">
          Certificate Status
        </h2>
        <p className="mb-4 text-gray-500 text-sm dark:text-gray-400">
          {cert.isDone && cert.doneAt
            ? `Marked as done on ${new Date(cert.doneAt).toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                },
              )}.`
            : "Mark this certificate as done when the physical certificate has been printed and is ready for the student."}
        </p>

        {cert.isDone ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle size={20} className="flex-shrink-0 text-green-600" />
              <div>
                <p className="font-bold text-green-800 text-sm dark:text-green-300">
                  Certificate is Ready ✓
                </p>
                <p className="mt-0.5 text-green-600 text-xs dark:text-green-400">
                  Students can see this certificate is done in their portal.
                </p>
              </div>
            </div>
            <button
              onClick={handleUnmark}
              disabled={doneLoading}
              className="w-full rounded-2xl border py-2.5 font-medium text-gray-500 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              type="button"
            >
              {doneLoading ? "Updating..." : "Undo — Mark as Not Done"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleMarkDone}
            disabled={doneLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3 font-bold text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50"
            type="button"
          >
            <CheckCircle size={16} />
            {doneLoading ? "Marking..." : "Mark Certificate as Done ✓"}
          </button>
        )}
      </div>

      <div className="rounded-3xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 font-bold text-gray-900 dark:text-white">
          Payment & Delivery
        </h2>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Payment Status</Label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <Label>Payment Method</Label>
            <select
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
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleUpdatePayment}
            disabled={paymentLoading}
            variant="outline"
          >
            {paymentLoading ? "Saving..." : "Update Payment"}
          </Button>
          <Button
            onClick={handleDeliver}
            disabled={deliverLoading || cert.isDelivered}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {deliverLoading
              ? "Processing..."
              : cert.isDelivered
                ? "Delivered ✓"
                : "📦 Mark as Delivered"}
          </Button>
        </div>
        {cert.notes && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-1 text-muted-foreground text-xs">Notes</p>
            <p className="text-sm">{cert.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
