export const dynamic = "force-dynamic";

import { RemainingList } from "@/components/admin/remaining/RemainingList";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

type RemainingPaymentSummary = { remainingAmount: number; dueDate: Date };

export default async function RemainingPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();

  const remainingPayments = await prisma.paymentRemaining.findMany({
    where: {
      status: { not: "PAID" },
      enrollment: {
        status: "ACTIVE",
        class: campusId ? { campusId } : undefined,
      },
    },
    include: {
      enrollment: {
        include: {
          student: { include: { user: true } },
          class: { include: { course: true, lab: true } },
        },
      },
      partialPayments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalRemaining = remainingPayments.reduce(
    (sum: number, payment: RemainingPaymentSummary) =>
      sum + payment.remainingAmount,
    0,
  );
  const overdueCount = remainingPayments.filter(
    (payment: RemainingPaymentSummary) =>
      new Date(payment.dueDate) < new Date(),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remaining Payments"
        description="Students with outstanding balances"
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold">{remainingPayments.length}</p>
          <p className="text-sm text-muted-foreground">
            Students with remaining
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
          <p className="text-sm text-muted-foreground">Overdue</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-2xl font-bold text-amber-700">
            ETB {totalRemaining.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Total outstanding</p>
        </div>
      </div>

      <RemainingList remainingPayments={remainingPayments} />
    </div>
  );
}
