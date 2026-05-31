export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";
export default async function WithdrawnPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      status: "ACTIVE",
      enrollment: { class: campusId ? { campusId } : undefined },
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
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold text-gray-700">No withdrawn students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => {
            const user = w.enrollment.student.user;
            const daysGone = Math.ceil(
              (Date.now() - new Date(w.startDate).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return (
              <Link
                key={w.id}
                href={`/admin/withdrawn/${w.id}`}
                className="block"
              >
                <div className="bg-white border rounded-xl p-5 hover:border-amber-300 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {w.enrollment.student.studentCode} •{" "}
                          {w.enrollment.class?.course.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reason: {w.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-700">
                        {daysGone} day{daysGone !== 1 ? "s" : ""} away
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expected back:{" "}
                        {w.expectedReturnDate
                          ? new Date(w.expectedReturnDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "Not specified"}
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
