export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminWithdrawnPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      status: "ACTIVE",
      enrollment: {
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
      approvedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Withdrawn Students"
        description={`${withdrawals.length} student${withdrawals.length !== 1 ? "s" : ""} currently on hold`}
      />

      {withdrawals.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">✅</p>
          <p className="font-semibold dark:text-white">No withdrawn students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => {
            const user = withdrawal.enrollment.student.user;
            const daysGone = Math.ceil(
              (Date.now() - new Date(withdrawal.startDate).getTime()) /
                (1000 * 60 * 60 * 24),
            );

            return (
              <Link
                key={withdrawal.id}
                href={`/super-admin/withdrawn/${withdrawal.id}?campusId=${campusId ?? ""}`}
              >
                <div className="rounded-xl border bg-white p-5 transition-all hover:border-amber-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700 dark:bg-amber-900/30">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-gray-500 text-sm dark:text-gray-400">
                          {withdrawal.enrollment.class?.course.title}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Reason: {withdrawal.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-amber-700 text-sm dark:text-amber-400">
                        {daysGone} day{daysGone !== 1 ? "s" : ""} away
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
