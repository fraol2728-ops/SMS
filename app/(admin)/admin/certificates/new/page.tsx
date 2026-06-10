export const dynamic = "force-dynamic";

import { ManualCertificateForm } from "@/components/admin/certificates/ManualCertificateForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function NewCertificatePage({
  searchParams,
}: {
  searchParams?: Promise<{ studentId?: string }>;
}) {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const params = await searchParams;
  const studentId = params?.studentId;

  const courses = await prisma.course.findMany({
    where: { isActive: true, campusId: campusId ?? undefined },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  let studentData = null;
  if (studentId) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                class: {
                  include: {
                    course: true,
                  },
                },
                paymentRemaining: true,
              },
            },
          },
        },
      },
    });

    if (student?.studentProfile) {
      const activeEnrollment = student.studentProfile.enrollments.find(
        (e) => e.status === "ACTIVE",
      );
      const remaining =
        activeEnrollment?.paymentRemaining ??
        student.studentProfile.enrollments.find(
          (e) => e.paymentRemaining && e.paymentRemaining.status !== "PAID",
        )?.paymentRemaining ??
        null;

      studentData = {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        enrollments: student.studentProfile.enrollments
          .filter((e) => e.class)
          .map((e) => ({
            id: e.id,
            courseTitle: e.class!.course.title,
            courseId: e.class!.courseId,
          })),
        remaining: remaining
          ? {
              remainingAmount: remaining.remainingAmount,
              paidAmount: remaining.paidAmount,
              originalFee: remaining.originalFee,
            }
          : null,
      };
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Add Certificate Manually" />
      <ManualCertificateForm courses={courses} studentData={studentData} />
    </div>
  );
}
