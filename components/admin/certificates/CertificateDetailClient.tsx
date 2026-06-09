"use client";

import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle,
  Copy,
  Edit2,
  Package,
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
  markCertificateAsDone,
  markCertificateDelivered,
  unmarkCertificateAsDone,
  updateCertificate,
} from "@/lib/actions/admin";

type CertificateDetailCert = {
  id: string;
  manualStudentName?: string | null;
  fullNameAmharic?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  isDelivered?: boolean;
  isDone?: boolean;
  deliveredAt?: Date | string | null;
  doneAt?: Date | string | null;
  issuedAt: Date | string;
  student?: { user: { firstName: string; lastName: string } } | null;
  course?: { title?: string | null } | null;
};

export function CertificateDetailClient({
  cert,
  studentRemaining,
}: {
  cert: CertificateDetailCert;
  studentRemaining: { remainingAmount: number; dueDate: Date | null } | null;
}) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [deliverLoading, setDeliverLoading] = useState(false);
  const [doneLoading, setDoneLoading] = useState(false);
  const [showBlockedWarning, setShowBlockedWarning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editValues, setEditValues] = useState({
    manualStudentName:
      cert.manualStudentName ??
      (cert.student
        ? `${cert.student.user.firstName} ${cert.student.user.lastName}`
        : ""),
    fullNameAmharic: cert.fullNameAmharic ?? "",
    receiptNumber: cert.receiptNumber ?? "",
    notes: cert.notes ?? "",
    paymentStatus: cert.paymentStatus ?? "PENDING",
  });

  const hasRemaining = studentRemaining && studentRemaining.remainingAmount > 0;
  const displayName =
    cert.manualStudentName ??
    (cert.student
      ? `${cert.student.user.firstName} ${cert.student.user.lastName}`
      : "—");

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
        toast.success("Certificate updated ✓");
        setEditing(false);
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditValues({
      manualStudentName:
        cert.manualStudentName ??
        (cert.student
          ? `${cert.student.user.firstName} ${cert.student.user.lastName}`
          : ""),
      fullNameAmharic: cert.fullNameAmharic ?? "",
      receiptNumber: cert.receiptNumber ?? "",
      notes: cert.notes ?? "",
      paymentStatus: cert.paymentStatus ?? "PENDING",
    });
    setEditing(false);
  }

  async function handleMarkDelivered() {
    if (hasRemaining) {
      setShowBlockedWarning(true);
      return;
    }
    setDeliverLoading(true);
    try {
      const res = await markCertificateDelivered(cert.id);
      if (res.success) {
        toast.success("Certificate marked as delivered 🎓");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setDeliverLoading(false);
    }
  }

  async function handleMarkDone() {
    if (!confirm("Mark this certificate as done/ready for collection?")) return;
    setDoneLoading(true);
    try {
      const res = await markCertificateAsDone(cert.id);
      if (res.success) {
        toast.success(
          "Certificate marked as done ✓ — Student has been notified!",
        );
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setDoneLoading(false);
    }
  }

  async function handleUnmarkDone() {
    if (!confirm("Remove done status?")) return;
    setDoneLoading(true);
    try {
      const res = await unmarkCertificateAsDone(cert.id);
      if (res.success) {
        toast.success("Done status removed");
        router.refresh();
      } else toast.error(res.error);
    } finally {
      setDoneLoading(false);
    }
  }

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, field)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
        copiedField === field
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-white dark:bg-gray-700 border dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
      }`}
    >
      {copiedField === field ? (
        <>
          <Check size={12} /> Copied!
        </>
      ) : (
        <>
          <Copy size={12} /> Copy
        </>
      )}
    </button>
  );

  const headerGradient = cert.isDelivered
    ? "bg-gradient-to-r from-green-500 to-teal-500"
    : cert.isDone
      ? "bg-gradient-to-r from-blue-500 to-indigo-600"
      : "bg-gradient-to-r from-amber-400 to-orange-500";

  const statusLabel = cert.isDelivered
    ? "Certificate Delivered ✓"
    : cert.isDone
      ? "Certificate Done — Ready to Collect"
      : "Certificate Issued — Pending";

  return (
    <div className="space-y-5 max-w-2xl">
      {showBlockedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close blocked delivery warning"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBlockedWarning(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <button
                type="button"
                onClick={() => setShowBlockedWarning(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
              Cannot Deliver Certificate
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              This student has an outstanding balance of{" "}
              <span className="font-black text-red-600">
                ETB {studentRemaining?.remainingAmount.toLocaleString()}
              </span>
              .
            </p>
            <p className="text-gray-500 text-sm mb-5">
              Collect the remaining payment before delivering the certificate.
            </p>
            <button
              type="button"
              onClick={() => setShowBlockedWarning(false)}
              className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-semibold text-sm hover:opacity-90"
            >
              Understood
            </button>
          </div>
        </div>
      )}

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
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              This student has{" "}
              <span className="font-black">
                ETB {studentRemaining?.remainingAmount.toLocaleString()}
              </span>{" "}
              remaining. Certificate cannot be delivered until fully paid.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-3xl overflow-hidden shadow-sm">
        <div className={`p-5 text-white ${headerGradient}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                🎓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {cert.isDelivered ? (
                    <CheckCircle size={16} />
                  ) : cert.isDone ? (
                    <Package size={16} />
                  ) : (
                    <Award size={16} />
                  )}
                  <p className="font-bold text-sm">{statusLabel}</p>
                </div>
                {cert.deliveredAt && (
                  <p className="text-white/80 text-xs mt-0.5">
                    Delivered{" "}
                    {new Date(cert.deliveredAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
                {cert.isDone && !cert.isDelivered && cert.doneAt && (
                  <p className="text-white/80 text-xs mt-0.5">
                    Ready since{" "}
                    {new Date(cert.doneAt).toLocaleDateString("en-GB", {
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
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl font-medium transition-colors"
              >
                <Edit2 size={14} />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm rounded-xl font-bold hover:bg-white/90 disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-xl"
                >
                  <XCircle size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {editing ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
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
                  className="h-10 w-full rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-3 text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={editValues.notes}
                  onChange={(e) =>
                    setEditValues((v) => ({ ...v, notes: e.target.value }))
                  }
                  rows={2}
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Full Name
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                    {displayName}
                  </p>
                  <CopyButton text={displayName} field="Full Name" />
                </div>
              </div>

              {cert.fullNameAmharic && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Full Name in Amharic
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
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
                  ...(cert.paymentMethod
                    ? [{ label: "Payment Method", value: cert.paymentMethod }]
                    : []),
                  ...(cert.notes
                    ? [{ label: "Notes", value: cert.notes }]
                    : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3"
                  >
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                {!cert.isDelivered &&
                  (cert.isDone ? (
                    <div className="space-y-2">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-center gap-3">
                        <Package
                          size={18}
                          className="text-blue-600 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">
                            Certificate is Done ✓
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                            Student has been notified to come collect it.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleUnmarkDone}
                        disabled={doneLoading}
                        className="w-full py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl border dark:border-gray-700 transition-colors disabled:opacity-50"
                      >
                        {doneLoading ? "Updating..." : "↩ Undo Mark as Done"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMarkDone}
                      disabled={doneLoading}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
                    >
                      <Package size={15} />
                      {doneLoading
                        ? "Marking..."
                        : "Mark Certificate as Done ✓"}
                    </button>
                  ))}

                {!cert.isDelivered && (
                  <button
                    type="button"
                    onClick={handleMarkDelivered}
                    disabled={deliverLoading}
                    className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      hasRemaining
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg"
                    }`}
                  >
                    {deliverLoading ? (
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
                )}

                {cert.isDelivered && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle
                      size={20}
                      className="text-green-600 flex-shrink-0"
                    />
                    <div>
                      <p className="font-bold text-green-800 dark:text-green-300 text-sm">
                        Certificate Successfully Delivered ✓
                      </p>
                      {cert.deliveredAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                          {new Date(cert.deliveredAt).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "long", year: "numeric" },
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
