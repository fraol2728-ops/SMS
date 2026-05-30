import { ClassForm } from "@/components/admin/classes/ClassForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewClassPage() {
  const campusId = await getCurrentUserCampusId();

  const [courses, teachers, labs] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true, campusId: campusId ?? undefined },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER", campusId: campusId ?? undefined },
      include: { teacherProfile: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.lab.findMany({
      where: {
        campusId: campusId ?? undefined,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Create new class" />
      <ClassForm courses={courses} teachers={teachers} labs={labs} />
    </div>
  );
}
