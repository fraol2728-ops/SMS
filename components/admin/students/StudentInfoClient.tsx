"use client";

import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  CreditCard,
  Edit,
  GraduationCap,
  MapPin,
  Phone,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { recordPartialPayment } from "@/lib/actions/admin";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { ClaimCertificateModal } from "../certificates/ClaimCertificateModal";
import { ChangeClassButton } from "./ChangeClassButton";
import { WithdrawButton } from "./WithdrawButton";

export function StudentInfoClient({
  student,
  activeEnrollment,
  remaining,
  hasRemaining,
  daysLeft,
  totalPaid,
  attendanceRate,
  attendanceRecords,
  availableClasses,
}: any) {
  const router = useRouter();
  const profile = student.studentProfile;
  const [activeTab, setActiveTab] = useState<
    "overview" | "attendance" | "payments"
  >("overview");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  async function handleRecordPayment() {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!remaining?.id) return;
    setLoading(true);
    try {
      const res = await recordPartialPayment(
        remaining.id,
        amount,
        paymentMethod,
        "",
      );
      if (res.success) {
        toast.success("Payment recorded successfully");
        setRecordingPayment(false);
        setPaymentAmount("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  const classInfo = activeEnrollment?.class;
  const timeLabel = classInfo
    ? (TIME_SLOTS[classInfo.timeSlot as keyof typeof TIME_SLOTS] ??
      classInfo.timeSlot)
    : null;
  const daysLabel = classInfo
    ? (CLASS_DAYS[classInfo.days as keyof typeof CLASS_DAYS] ?? classInfo.days)
    : null;
  const presentSessions = attendanceRecords.filter(
    (a: any) => a.status === "PRESENT",
  ).length;
  const progressPercent = remaining?.originalFee
    ? Math.min(100, (remaining.paidAmount / remaining.originalFee) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to students
        </Link>

        {showCertModal && activeEnrollment && (
          <ClaimCertificateModal
            student={{
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              fullNameAmharic: profile.fullNameAmharic ?? null,
            }}
            studentProfileId={profile.id}
            courseId={activeEnrollment.class?.course?.id ?? ""}
            courseTitle={activeEnrollment.class?.course?.title ?? ""}
            enrollmentId={activeEnrollment.id}
            remainingBalance={remaining?.remainingAmount ?? null}
            onClose={() => setShowCertModal(false)}
          />
        )}

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="p-6">
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 font-black text-2xl text-white shadow-lg">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-black text-2xl text-gray-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </h1>
                  {student.gender && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
                      {student.gender}
                    </span>
                  )}
                </div>
                <p className="font-mono text-gray-500 text-sm">
                  {profile.studentCode}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-gray-500 text-sm">
                  {student.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-green-500" />
                      {student.phone}
                    </span>
                  )}
                  {student.campus && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-blue-500" />
                      {student.campus.name}
                    </span>
                  )}
                  {profile.registrationDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-purple-500" />
                      Registered{" "}
                      {new Date(profile.registrationDate).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-wrap gap-2">
                {student.phone && (
                  <a
                    href={`tel:${student.phone}`}
                    className="flex items-center gap-2 rounded-2xl bg-green-500 px-4 py-2 font-medium text-sm text-white shadow-sm transition-colors hover:bg-green-600"
                  >
                    <Phone size={14} />
                    Call
                  </a>
                )}
                {student.telegram && (
                  <a
                    href={`https://t.me/${student.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-blue-500 px-4 py-2 font-medium text-sm text-white shadow-sm transition-colors hover:bg-blue-600"
                  >
                    Telegram
                  </a>
                )}
                {student.whatsapp && (
                  <a
                    href={`https://wa.me/${student.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-green-600 px-4 py-2 font-medium text-sm text-white shadow-sm transition-colors hover:bg-green-700"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div
            className={`rounded-3xl border p-5 ${attendanceRate >= 80 ? "border-green-100 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20" : attendanceRate >= 60 ? "border-amber-100 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/20" : "border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-900/20"}`}
          >
            <ClipboardCheck
              size={20}
              className={`mb-2 ${attendanceRate >= 80 ? "text-green-600" : attendanceRate >= 60 ? "text-amber-600" : "text-red-600"}`}
            />
            <p
              className={`font-black text-3xl ${attendanceRate >= 80 ? "text-green-700 dark:text-green-400" : attendanceRate >= 60 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}`}
            >
              {attendanceRate}%
            </p>
            <p className="mt-1 text-gray-500 text-xs">Attendance Rate</p>
            <p className="mt-0.5 text-gray-400 text-xs">
              {presentSessions} / {attendanceRecords.length} sessions
            </p>
          </div>

          <div
            className={`rounded-3xl border p-5 ${hasRemaining ? "border-amber-100 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/20" : "border-green-100 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20"}`}
          >
            <CreditCard
              size={20}
              className={`mb-2 ${hasRemaining ? "text-amber-600" : "text-green-600"}`}
            />
            <p
              className={`font-black text-xl leading-tight ${hasRemaining ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"}`}
            >
              ETB {totalPaid.toLocaleString()}
            </p>
            <p className="mt-1 text-gray-500 text-xs">Total Paid</p>
            {hasRemaining ? (
              <p className="mt-0.5 font-semibold text-amber-600 text-xs">
                ETB {remaining.remainingAmount.toLocaleString()} remaining
              </p>
            ) : (
              <p className="mt-0.5 font-semibold text-green-600 text-xs">
                Fully Paid ✓
              </p>
            )}
          </div>

          {hasRemaining && daysLeft !== null ? (
            <div
              className={`rounded-3xl border p-5 ${daysLeft < 0 ? "border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-900/20" : daysLeft <= 7 ? "border-amber-100 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/20" : "border-green-100 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20"}`}
            >
              <Clock
                size={20}
                className={`mb-2 ${daysLeft < 0 ? "text-red-600" : daysLeft <= 7 ? "text-amber-600" : "text-green-600"}`}
              />
              <p
                className={`font-black text-3xl ${daysLeft < 0 ? "text-red-700 dark:text-red-400" : daysLeft <= 7 ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"}`}
              >
                {Math.abs(daysLeft)}d
              </p>
              <p className="mt-1 text-gray-500 text-xs">
                {daysLeft < 0 ? "Days Overdue" : "Days Until Due"}
              </p>
              <p className="mt-0.5 text-gray-400 text-xs">
                Due: {new Date(remaining.dueDate).toLocaleDateString("en-GB")}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-green-100 bg-green-50 p-5 dark:border-green-900/30 dark:bg-green-900/20">
              <CheckCircle size={20} className="mb-2 text-green-600" />
              <p className="font-black text-2xl text-green-700 dark:text-green-400">
                Paid
              </p>
              <p className="mt-1 text-gray-500 text-xs">Payment Status</p>
              <p className="mt-0.5 text-green-600 text-xs">
                No remaining balance
              </p>
            </div>
          )}

          <div className="rounded-3xl border border-purple-100 bg-purple-50 p-5 dark:border-purple-900/30 dark:bg-purple-900/20">
            <BookOpen size={20} className="mb-2 text-purple-600" />
            <p className="font-black text-purple-700 text-sm leading-tight dark:text-purple-400">
              {classInfo?.course?.title ?? "No class"}
            </p>
            <p className="mt-1 text-gray-500 text-xs">Current Course</p>
            {classInfo?.lab && (
              <p className="mt-0.5 text-gray-400 text-xs">
                {classInfo.lab.name}
              </p>
            )}
          </div>
        </div>

        {hasRemaining && (
          <div className="rounded-3xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  Outstanding Balance
                </h2>
                <p className="mt-0.5 text-gray-500 text-sm">
                  ETB {remaining.remainingAmount.toLocaleString()} remaining
                  {daysLeft !== null && (
                    <span
                      className={`ml-2 font-semibold ${daysLeft < 0 ? "text-red-600" : daysLeft <= 7 ? "text-amber-600" : "text-green-600"}`}
                    >
                      (
                      {daysLeft < 0
                        ? `${Math.abs(daysLeft)} days overdue`
                        : `${daysLeft} days left`}
                      )
                    </span>
                  )}
                </p>
              </div>
              {!recordingPayment && (
                <button
                  onClick={() => setRecordingPayment(true)}
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 font-semibold text-sm text-white shadow-sm transition-colors hover:bg-blue-700"
                  type="button"
                >
                  <CreditCard size={14} />
                  Record Payment
                </button>
              )}
            </div>
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-gray-400 text-xs">
                <span>ETB {remaining.paidAmount.toLocaleString()} paid</span>
                <span>ETB {remaining.originalFee.toLocaleString()} total</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            {recordingPayment && (
              <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <h3 className="font-semibold text-gray-900 text-sm dark:text-white">
                  Record Payment
                </h3>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="Amount (ETB)"
                    max={remaining.remainingAmount}
                    className="h-10 flex-1 rounded-xl border bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="h-10 rounded-xl border bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRecordPayment}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    type="button"
                  >
                    {loading ? "Recording..." : "Save Payment"}
                  </button>
                  <button
                    onClick={() => {
                      setRecordingPayment(false);
                      setPaymentAmount("");
                    }}
                    className="rounded-xl border bg-white px-4 py-2.5 text-gray-600 text-sm transition-colors dark:border-gray-600 dark:bg-gray-800"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {remaining.partialPayments?.length > 0 && (
              <div className="mt-4 border-t pt-4 dark:border-gray-700">
                <p className="mb-2 font-bold text-gray-400 text-xs">
                  PAYMENT HISTORY
                </p>
                <div className="space-y-2">
                  {remaining.partialPayments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {payment.method} —{" "}
                        {new Date(payment.createdAt).toLocaleDateString(
                          "en-GB",
                        )}
                      </span>
                      <span className="font-semibold text-green-600">
                        + ETB {payment.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {classInfo && (
          <div className="rounded-3xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 font-bold text-gray-900 dark:text-white">
              Current Class
            </h2>
            <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
              <p className="mb-3 font-black text-xl">
                {classInfo.course.title}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Building2, label: classInfo.lab?.name ?? "Online" },
                  { icon: Clock, label: timeLabel ?? "—" },
                  { icon: Calendar, label: daysLabel ?? "—" },
                  {
                    icon: GraduationCap,
                    label: classInfo.teacher
                      ? `${classInfo.teacher.user.firstName} ${classInfo.teacher.user.lastName}`
                      : "—",
                  },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2"
                  >
                    <Icon size={13} className="flex-shrink-0" />
                    <span className="truncate font-medium text-sm">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/students/${student.id}/edit`}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-white/30"
                >
                  <Edit size={13} />
                  Edit Student
                </Link>
                <button
                  onClick={() => setShowCertModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-amber-500"
                  type="button"
                >
                  <Award size={13} />
                  Claim Certificate
                </button>
                <WithdrawButton
                  enrollmentId={activeEnrollment.id}
                  studentName={`${student.firstName} ${student.lastName}`}
                />
                <ChangeClassButton
                  enrollmentId={activeEnrollment.id}
                  availableClasses={availableClasses}
                  currentClassId={activeEnrollment.classId ?? ""}
                />
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex border-b dark:border-gray-700">
            {[
              { id: "overview", label: "Personal Info" },
              { id: "attendance", label: "Attendance" },
              { id: "payments", label: "Payments" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3.5 font-semibold text-sm transition-colors ${activeTab === tab.id ? "border-blue-600 border-b-2 text-blue-600 dark:border-blue-400 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Email",
                    value: student.email?.includes("@exceed.local")
                      ? "—"
                      : student.email,
                  },
                  { label: "Phone", value: student.phone ?? "—" },
                  { label: "Gender", value: student.gender ?? "—" },
                  { label: "Address", value: student.address ?? "—" },
                  { label: "Guardian", value: profile.guardianName ?? "—" },
                  {
                    label: "Guardian Phone",
                    value: profile.guardianPhone ?? "—",
                  },
                  {
                    label: "Emergency Contact",
                    value: profile.emergencyContact ?? "—",
                  },
                  { label: "Telegram", value: student.telegram ?? "—" },
                  { label: "WhatsApp", value: student.whatsapp ?? "—" },
                  {
                    label: "Receipt Number",
                    value: profile.receiptNumber ?? "—",
                  },
                  {
                    label: "Registration Date",
                    value: profile.registrationDate
                      ? new Date(profile.registrationDate).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "long", year: "numeric" },
                        )
                      : new Date(student.createdAt).toLocaleDateString("en-GB"),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800"
                  >
                    <p className="mb-1 font-semibold text-gray-400 text-xs uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="font-semibold text-gray-900 text-sm dark:text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "attendance" && (
              <div>
                {attendanceRecords.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">
                    <ClipboardCheck
                      size={40}
                      className="mx-auto mb-3 opacity-20"
                    />
                    <p>No attendance recorded yet</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attendanceRecords.map((attendance: any) => (
                      <div
                        key={attendance.id}
                        title={`${new Date(attendance.date).toLocaleDateString("en-GB")} — ${attendance.status}`}
                        className={`flex h-10 w-10 cursor-default flex-col items-center justify-center rounded-xl font-bold text-xs ${attendance.status === "PRESENT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : attendance.status === "ABSENT" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
                      >
                        <span>{new Date(attendance.date).getDate()}</span>
                        <span className="text-xs leading-none">
                          {attendance.status === "PRESENT"
                            ? "✓"
                            : attendance.status === "ABSENT"
                              ? "✗"
                              : "L"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "payments" && (
              <div>
                {!activeEnrollment?.payments.length ? (
                  <div className="py-10 text-center text-gray-400">
                    <CreditCard size={40} className="mx-auto mb-3 opacity-20" />
                    <p>No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeEnrollment?.payments.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-2xl bg-gray-50 p-4 dark:bg-gray-800"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 text-sm dark:text-white">
                            ETB {payment.amount.toLocaleString()}
                          </p>
                          <p className="mt-0.5 text-gray-400 text-xs">
                            {payment.method ?? "—"} •{" "}
                            {new Date(payment.createdAt).toLocaleDateString(
                              "en-GB",
                            )}
                            {payment.receiptNumber &&
                              ` • Receipt: ${payment.receiptNumber}`}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 font-bold text-xs ${payment.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={async () => {
              if (!confirm("Delete this student? This cannot be undone."))
                return;
            }}
            className="flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2 text-red-600 text-sm transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
            type="button"
          >
            <Trash2 size={14} />
            Delete Student
          </button>
        </div>
      </div>
    </div>
  );
}
