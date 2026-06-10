export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function StudentPaymentsPage() {
  await requireStudent();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      payments: {
        include: {
          enrollment: {
            include: { class: { include: { course: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      studentProfile: {
        include: {
          enrollments: {
            where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
            include: {
              paymentRemaining: {
                include: {
                  partialPayments: { orderBy: { createdAt: "desc" } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!student) redirect("/sign-in");

  const totalPaid = student.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = student.studentProfile?.enrollments.find(
    (enrollment) =>
      enrollment.paymentRemaining &&
      enrollment.paymentRemaining.remainingAmount > 0,
  )?.paymentRemaining;
  const hasRemaining = Boolean(remaining && remaining.remainingAmount > 0);
  const daysUntilDue = remaining?.dueDate
    ? Math.ceil(
        (new Date(remaining.dueDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Your payment history and balance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-3xl p-6 text-white shadow-md">
          <CheckCircle size={24} className="mb-3 opacity-80" />
          <p className="text-3xl font-black">
            ETB {totalPaid.toLocaleString()}
          </p>
          <p className="text-green-100 mt-1">Total Paid</p>
        </div>

        {hasRemaining && remaining ? (
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-md">
            <AlertCircle size={24} className="mb-3 opacity-80" />
            <p className="text-3xl font-black">
              ETB {remaining.remainingAmount.toLocaleString()}
            </p>
            <p className="text-amber-100 mt-1">Remaining Balance</p>
            {daysUntilDue !== null && (
              <p
                className={`text-sm font-bold mt-2 ${daysUntilDue < 0 ? "text-red-200" : "text-white"}`}
              >
                {daysUntilDue < 0
                  ? `⚠️ ${Math.abs(daysUntilDue)} days overdue`
                  : `Due in ${daysUntilDue} days`}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl p-6 text-white shadow-md">
            <CreditCard size={24} className="mb-3 opacity-80" />
            <p className="text-3xl font-black">All Clear ✓</p>
            <p className="text-blue-100 mt-1">No remaining balance</p>
          </div>
        )}
      </div>

      {hasRemaining && remaining && remaining.partialPayments.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">
            Partial Payments Made
          </h2>
          <div className="space-y-3">
            {remaining.partialPayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-2xl"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    ETB {p.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.method} •{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className="text-green-600 font-bold text-sm">+Paid</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Original fee</span>
              <span className="font-semibold">
                ETB {remaining.originalFee.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Total paid</span>
              <span className="font-semibold text-green-600">
                ETB {remaining.paidAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Still remaining</span>
              <span className="font-semibold text-amber-600">
                ETB {remaining.remainingAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">
          Payment History ({student.payments.length})
        </h2>
        {student.payments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">
            No payments recorded yet
          </p>
        ) : (
          <div className="space-y-3">
            {student.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.status === "PAID" ? "bg-green-100" : "bg-amber-100"}`}
                  >
                    <CreditCard
                      size={18}
                      className={
                        p.status === "PAID"
                          ? "text-green-600"
                          : "text-amber-600"
                      }
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      ETB {p.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.method ?? "—"} •{" "}
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${p.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
