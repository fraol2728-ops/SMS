export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { AssignClassForm } from "@/components/admin/students/AssignClassForm";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminWithdrawnDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    include: {
      enrollment: {
        include: {
          student: { include: { user: true } },
          class: { include: { course: true, lab: true } },
        },
      },
    },
  });

  if (!withdrawal) notFound();

  const availableClasses = await prisma.class.findMany({
    where: {
      campusId: campusId ?? undefined,
      isActive: true,
      status: "REGISTRATION",
    },
    include: {
      course: true,
      lab: true,
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
  });

  const user = withdrawal.enrollment.student.user;
  const daysAway = Math.ceil(
    (Date.now() - new Date(withdrawal.startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/super-admin/withdrawn?campusId=${campusId ?? ""}`}>
        <button
          className="text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back
        </button>
      </Link>

      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description="Withdrawn student"
      />

      <div className="space-y-4 rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Student Code",
              value: withdrawal.enrollment.student.studentCode,
            },
            {
              label: "Previous Class",
              value: withdrawal.enrollment.class?.course.title ?? "—",
            },
            { label: "Reason", value: withdrawal.reason },
            { label: "Days Away", value: `${daysAway} days` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
            >
              <p className="mb-1 text-gray-400 text-xs">{label}</p>
              <p className="font-medium text-sm dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        <h2 className="font-semibold dark:text-white">Assign to New Class</h2>
        <AssignClassForm
          enrollmentId={withdrawal.enrollmentId}
          availableClasses={availableClasses}
          redirectTo={`/super-admin/withdrawn?campusId=${campusId ?? ""}`}
        />
      </div>
    </div>
  );
}
