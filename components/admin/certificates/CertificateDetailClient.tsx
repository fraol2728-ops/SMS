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
  redirectTo = "/admin/certificates",
}: {
  cert: any;
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
        <div className="grid grid-cols-2 gap-4">
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
