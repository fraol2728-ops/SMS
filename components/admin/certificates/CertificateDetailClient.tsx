"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  markCertificateDelivered,
  updateCertificatePayment,
} from "@/lib/actions/admin";
export function CertificateDetailClient({
  cert,
  studentRemaining,
  redirectTo = "/admin/certificates",
}: {
  cert: any;
  studentRemaining?: { remainingAmount: number; dueDate: Date } | null;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState(cert.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState(
    cert.paymentMethod ?? "CASH",
  );
  const [loading, setLoading] = useState(false);
  const [deliverLoading, setDeliverLoading] = useState(false);
  async function handleUpdatePayment() {
    setLoading(true);
    try {
      const res = await updateCertificatePayment(
        cert.id,
        paymentStatus,
        paymentMethod,
      );
      if (res.success) {
        toast.success("Payment updated");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setLoading(false);
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
      } else toast.error(res.error);
    } finally {
      setDeliverLoading(false);
    }
  }
  const user = cert.student?.user;
  const studentName =
    cert.manualStudentName ??
    (`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
      "Manual student");
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center text-3xl">
            🎓
          </div>
          <div>
            <h2 className="text-xl font-bold">{studentName}</h2>
            <p className="text-muted-foreground">{cert.course.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Issued: {new Date(cert.issuedAt).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>
        {studentRemaining && studentRemaining.remainingAmount > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
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
        {cert.fullNameAmharic && (
          <div className="mt-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
            <p className="mb-1 text-gray-400 text-xs">Full Name in Amharic</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {cert.fullNameAmharic}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Payment Status</Label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="PAID">Paid</option>
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
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleUpdatePayment}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Saving..." : "Update Payment"}
          </Button>
          <Button
            onClick={handleDeliver}
            disabled={deliverLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {deliverLoading ? "Processing..." : "✅ Mark as Delivered"}
          </Button>
        </div>
        {cert.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{cert.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
