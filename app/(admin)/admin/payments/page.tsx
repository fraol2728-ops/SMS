export const dynamic = "force-dynamic";

import type { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { PaymentsClient } from "@/components/admin/payments/PaymentsClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: {
    method?: string;
    status?: string;
    q?: string;
    range?: string;
  };
}) {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const { method, status, q, range } = searchParams;

  let dateFrom: Date | undefined;
  const now = new Date();
  if (range === "7d") {
    dateFrom = new Date(now);
    dateFrom.setDate(now.getDate() - 7);
  } else if (range === "30d") {
    dateFrom = new Date(now);
    dateFrom.setDate(now.getDate() - 30);
  } else if (range === "month") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const where: Prisma.PaymentWhereInput = {
    user: { campusId: campusId ?? undefined },
    ...(status ? { status: status as PaymentStatus } : {}),
    ...(method ? { method: method as PaymentMethod } : {}),
    ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
    ...(q
      ? {
          user: {
            campusId: campusId ?? undefined,
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [payments, totalRevenue, monthRevenue, outstanding] = await Promise.all(
    [
      prisma.payment.findMany({
        where,
        include: {
          user: true,
          enrollment: { include: { class: { include: { course: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.payment.aggregate({
        where: { user: { campusId: campusId ?? undefined } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          user: { campusId: campusId ?? undefined },
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
      prisma.paymentRemaining.aggregate({
        where: {
          status: { not: "PAID" },
          enrollment: { class: { campusId: campusId ?? undefined } },
        },
        _sum: { remainingAmount: true },
      }),
    ],
  );

  const stats = {
    totalRevenue: totalRevenue._sum.amount ?? 0,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    outstanding: outstanding._sum.remainingAmount ?? 0,
    totalTransactions: payments.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track all payment transactions"
      />
      <PaymentsClient
        payments={payments}
        stats={stats}
        currentFilters={{
          method: method ?? "",
          status: status ?? "",
          q: q ?? "",
          range: range ?? "",
        }}
      />
    </div>
  );
}
