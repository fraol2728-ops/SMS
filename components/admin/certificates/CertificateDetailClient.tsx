"use client";

import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle,
  Copy,
  Edit2,
  Save,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  markCertificateDelivered,
  updateCertificate,
} from "@/lib/actions/admin";

type CertificateDetail = {
  id: string;
  manualStudentName?: string | null;
  fullNameAmharic?: string | null;
  receiptNumber?: string | null;
  issuedAt: Date | string;
  paymentStatus: string;
  isDelivered: boolean;
  deliveredAt?: Date | string | null;
  notes?: string | null;
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fallbackStudentName = cert.student
    ? `${cert.student.user.firstName} ${cert.student.user.lastName}`
    : "";

  const [editValues, setEditValues] = useState({
    manualStudentName: cert.manualStudentName ?? fallbackStudentName,
    fullNameAmharic: cert.fullNameAmharic ?? "",
    receiptNumber: cert.receiptNumber ?? "",
    notes: cert.notes ?? "",
    paymentStatus: cert.paymentStatus ?? "PENDING",
  });

  const remainingAmount = studentRemaining?.remainingAmount ?? 0;
  const hasRemaining = remainingAmount > 0;
  const displayName = cert.manualStudentName ?? (fallbackStudentName || "—");

  function resetEditValues() {
    setEditValues({
      manualStudentName: cert.manualStudentName ?? fallbackStudentName,
      fullNameAmharic: cert.fullNameAmharic ?? "",
      receiptNumber: cert.receiptNumber ?? "",
      notes: cert.notes ?? "",
      paymentStatus: cert.paymentStatus ?? "PENDING",
    });
  }

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

  async function handleSaveEdit() {
    if (!editValues.manualStudentName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("manualStudentName", editValues.manualStudentName);
      formData.set("fullNameAmharic", editValues.fullNameAmharic);
      formData.set("receiptNumber", editValues.receiptNumber);
      formData.set("notes", editValues.notes);
      formData.set("paymentStatus", editValues.paymentStatus);

      const res = await updateCertificate(cert.id, formData);
      if (res.success) {
        toast.success("Certificate updated successfully ✓");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    resetEditValues();
    setEditing(false);
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
              Please collect the remaining payment before delivering.
            </p>
            <button
              onClick={() => setShowBlockedWarning(false)}
              className="w-full rounded-2xl bg-gray-900 py-3 font-semibold text-sm text-white hover:opacity-90 dark:bg-white dark:text-gray-900"
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
              remaining. Cannot deliver until fully paid.
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
          <div className="flex items-center justify-between gap-3">
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
                    Delivered{" "}
                    {new Date(cert.deliveredAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-white/30"
                type="button"
              >
                <Edit2 size={14} />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold text-gray-900 text-sm transition-colors hover:bg-white/90 disabled:opacity-50"
                  type="button"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm text-white transition-colors hover:bg-white/30"
                  type="button"
                  aria-label="Cancel editing"
                >
                  <XCircle size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6">
          {editing ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="font-medium text-blue-700 text-xs dark:text-blue-400">
                  ✏️ Edit mode — update the certificate details below
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input
                  value={editValues.manualStudentName}
                  onChange={(e) =>
                    setEditValues((v) => ({
                      ...v,
                      manualStudentName: e.target.value,
                    }))
                  }
                  placeholder="Student full name"
                  className="font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Full Name in Amharic</Label>
                <Input
                  value={editValues.fullNameAmharic}
                  onChange={(e) =>
                    setEditValues((v) => ({
                      ...v,
                      fullNameAmharic: e.target.value,
                    }))
                  }
                  placeholder="ሙሉ ስም በአማርኛ"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Receipt Number</Label>
                <Input
                  value={editValues.receiptNumber}
                  onChange={(e) =>
                    setEditValues((v) => ({
                      ...v,
                      receiptNumber: e.target.value,
                    }))
                  }
                  placeholder="e.g. RCP-2024-001"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Payment Status</Label>
                <select
                  value={editValues.paymentStatus}
                  onChange={(e) =>
                    setEditValues((v) => ({
                      ...v,
                      paymentStatus: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={editValues.notes}
                  onChange={(e) =>
                    setEditValues((v) => ({ ...v, notes: e.target.value }))
                  }
                  placeholder="Any additional notes..."
                  rows={2}
                  className="rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  type="button"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-2xl bg-gray-100 px-5 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="mb-2 font-semibold text-gray-400 text-xs uppercase tracking-wide">
                  Full Name
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-gray-900 text-lg leading-tight dark:text-white">
                    {displayName}
                  </p>
                  <CopyButton text={displayName} field="Full Name" />
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
                    <CopyButton
                      text={cert.fullNameAmharic}
                      field="Amharic Name"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Course", value: cert.course?.title ?? "—" },
                  {
                    label: "Receipt Number",
                    value: cert.receiptNumber ?? "—",
                  },
                  {
                    label: "Issued",
                    value: new Date(cert.issuedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }),
                  },
                  { label: "Payment Status", value: cert.paymentStatus },
                  ...(cert.notes
                    ? [{ label: "Notes", value: cert.notes }]
                    : []),
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
                        ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800"
                        : "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md hover:from-green-600 hover:to-teal-600 hover:shadow-lg"
                    }`}
                    type="button"
                  >
                    {loading ? (
                      "Marking..."
                    ) : hasRemaining ? (
                      <>
                        <AlertTriangle size={15} /> Cannot Deliver — Outstanding
                        Balance
                      </>
                    ) : (
                      <>
                        <CheckCircle size={15} /> Mark as Delivered
                      </>
                    )}
                  </button>
                  {hasRemaining && (
                    <p className="mt-2 text-center text-gray-400 text-xs">
                      Collect remaining payment first
                    </p>
                  )}
                </div>
              )}

              {cert.isDelivered && (
                <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/20">
                  <CheckCircle
                    size={20}
                    className="flex-shrink-0 text-green-600"
                  />
                  <div>
                    <p className="font-bold text-green-800 text-sm dark:text-green-300">
                      Certificate Successfully Delivered ✓
                    </p>
                    {cert.deliveredAt && (
                      <p className="mt-0.5 text-green-600 text-xs dark:text-green-400">
                        {new Date(cert.deliveredAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
