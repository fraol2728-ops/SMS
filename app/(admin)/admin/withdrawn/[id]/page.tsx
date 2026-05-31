export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { AssignClassForm } from "@/components/admin/students/AssignClassForm";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";
export default async function WithdrawnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();
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
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description="Withdrawn student details"
      />
      <div className="bg-white border rounded-xl p-6 space-y-4">
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
            { label: "Withdrawal Reason", value: withdrawal.reason },
            {
              label: "Days Away",
              value: `${Math.ceil((Date.now() - new Date(withdrawal.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
            },
            {
              label: "Expected Return",
              value: withdrawal.expectedReturnDate
                ? new Date(withdrawal.expectedReturnDate).toLocaleDateString(
                    "en-GB",
                  )
                : "Not set",
            },
            { label: "Notes", value: withdrawal.notes ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Assign to New Class</h2>
        <AssignClassForm
          enrollmentId={withdrawal.enrollmentId}
          availableClasses={availableClasses}
        />
      </div>
    </div>
  );
}
