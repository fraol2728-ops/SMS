export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { StudentInfoClient } from "@/components/admin/students/StudentInfoClient";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const student = await prisma.user.findUnique({
    where: { id },
    include: {
      campus: true,
      studentProfile: {
        include: {
          enrollments: {
            include: {
              class: {
                include: {
                  course: true,
                  lab: true,
                  teacher: { include: { user: true } },
                },
              },
              payments: { orderBy: { createdAt: "desc" } },
              attendance: { orderBy: { date: "desc" } },
              paymentRemaining: {
                include: {
                  partialPayments: { orderBy: { createdAt: "desc" } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          certificates: { include: { course: true } },
          assessment: true,
        },
      },
    },
  });

  if (!student?.studentProfile) notFound();

  const activeEnrollment = student.studentProfile.enrollments.find(
    (enrollment) => enrollment.status === "ACTIVE",
  );
  const remaining =
    activeEnrollment?.paymentRemaining ??
    student.studentProfile.enrollments.find(
      (enrollment) =>
        enrollment.paymentRemaining &&
        enrollment.paymentRemaining.status !== "PAID",
    )?.paymentRemaining ??
    null;
  const hasRemaining = !!remaining && remaining.remainingAmount > 0;
  const daysLeft = remaining?.dueDate
    ? Math.ceil(
        (new Date(remaining.dueDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;
  const totalPaid = student.studentProfile.enrollments
    .flatMap((enrollment) => enrollment.payments)
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const attendanceRecords = activeEnrollment?.attendance ?? [];
  const presentCount = attendanceRecords.filter(
    (attendance) => attendance.status === "PRESENT",
  ).length;
  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : 0;

  const availableClasses = await prisma.class.findMany({
    where: {
      campusId: student.campusId ?? undefined,
      isActive: true,
      status: { in: ["REGISTRATION", "STARTED"] },
    },
    include: {
      course: true,
      lab: true,
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
  });

  return (
    <StudentInfoClient
      student={student}
      activeEnrollment={activeEnrollment}
      remaining={remaining}
      hasRemaining={hasRemaining}
      daysLeft={daysLeft}
      totalPaid={totalPaid}
      attendanceRate={attendanceRate}
      attendanceRecords={attendanceRecords}
      availableClasses={availableClasses}
    />
  );
}
