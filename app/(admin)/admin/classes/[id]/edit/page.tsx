import { notFound } from "next/navigation";
import { ClassForm } from "@/components/admin/classes/ClassForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();
  const classRecord = await prisma.class.findFirst({
    where: { id, ...(campusId ? { campusId } : {}) },
    include: {
      course: true,
      lab: true,
      teacher: true,
    },
  });

  if (!classRecord) notFound();

  const [courses, teachers, labs]: [
    { id: string; title: string }[],
    { id: string; user: { firstName: string; lastName: string } }[],
    { id: string; name: string }[],
  ] = await Promise.all([
    prisma.course.findMany({ where: { campusId: campusId ?? undefined } }),
    prisma.teacherProfile.findMany({
      where: { user: { campusId: campusId ?? undefined } },
      include: { user: true },
    }),
    prisma.lab.findMany({
      where: { campusId: campusId ?? undefined, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Edit class" />
      <ClassForm
        courses={courses.map((course) => ({ id: course.id, title: course.title }))}
        teachers={teachers.map((teacher) => ({
          id: teacher.id,
          firstName: teacher.user.firstName,
          lastName: teacher.user.lastName,
          teacherProfile: { id: teacher.id },
        }))}
        labs={labs.map((lab) => ({ id: lab.id, name: lab.name }))}
        defaultValues={{
          id: classRecord.id,
          courseId: classRecord.courseId,
          teacherId: classRecord.teacherId,
          labId: classRecord.labId,
          timeSlot: classRecord.timeSlot,
          days: classRecord.days,
          capacity: classRecord.capacity,
        }}
      />
    </div>
  );
}
