export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RemainingList } from "@/components/admin/remaining/RemainingList";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminRemainingPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

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
    (sum, remaining) => sum + remaining.remainingAmount,
    0,
  );
  const overdueCount = remainingPayments.filter(
    (remaining) => new Date(remaining.dueDate) < new Date(),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remaining Payments"
        description="Students with outstanding balances"
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="font-bold text-2xl dark:text-white">
            {remainingPayments.length}
          </p>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            Students with remaining
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
          <p className="font-bold text-2xl text-red-700 dark:text-red-400">
            {overdueCount}
          </p>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            Overdue
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/20">
          <p className="font-bold text-2xl text-amber-700 dark:text-amber-400">
            ETB {totalRemaining.toLocaleString()}
          </p>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            Total outstanding
          </p>
        </div>
      </div>

      <RemainingList remainingPayments={remainingPayments} />
    </div>
  );
}
