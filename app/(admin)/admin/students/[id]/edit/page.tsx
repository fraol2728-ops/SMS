import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  return (
    <div className="space-y-6">
      <PageHeader title="Edit student" />
      <StudentForm
        classes={classes}
        defaultValues={{
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          gender: student.gender,
          address: student.address,
          dateOfBirth: student.dateOfBirth?.toISOString(),
          guardianName: student.studentProfile?.guardianName,
          guardianPhone: student.studentProfile?.guardianPhone,
          emergencyContact: student.studentProfile?.emergencyContact,
          notes: student.studentProfile?.notes,
        }}
      />
    </div>
  );
}
