import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();
  const student = await prisma.user.findFirst({
    where: { id, ...(campusId ? { campusId } : {}) },
    include: { studentProfile: true },
  });
  if (!student) notFound();
  const classes = await prisma.class.findMany({
    where: { isActive: true, ...(campusId ? { campusId } : {}) },
    include: {
      course: { select: { title: true, fee: true } },
      lab: { select: { name: true } },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
  });

  const formattedClasses = classes.map((classItem) => ({
    ...classItem,
    startDate: classItem.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: classItem.endDate?.toISOString().slice(0, 10) ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Edit student" />
      <StudentForm
        classes={formattedClasses}
        defaultValues={{
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone ?? undefined,
          telegram: student.telegram ?? undefined,
          whatsapp: student.whatsapp ?? undefined,
          registrationDate:
            student.studentProfile?.registrationDate?.toISOString(),
          gender: student.gender ?? undefined,
          address: student.address ?? undefined,
          dateOfBirth: student.dateOfBirth?.toISOString(),
          guardianName: student.studentProfile?.guardianName ?? undefined,
          guardianPhone: student.studentProfile?.guardianPhone ?? undefined,
          emergencyContact:
            student.studentProfile?.emergencyContact ?? undefined,
          notes: student.studentProfile?.notes ?? undefined,
        }}
      />
    </div>
  );
}
