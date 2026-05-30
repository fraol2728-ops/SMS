import { ClassForm } from "@/components/admin/classes/ClassForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewClassPage() {
  const campusId = await getCurrentUserCampusId();

  const [courses, teachers, campus] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true, campusId: campusId ?? undefined },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER", campusId: campusId ?? undefined },
      include: { teacherProfile: true },
      orderBy: { firstName: "asc" },
    }),
    campusId ? prisma.campus.findUnique({ where: { id: campusId } }) : null,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Create new class" />
      <ClassForm
        courses={courses}
        teachers={teachers}
        campusName={campus?.name ?? ""}
      />
    </div>
  );
}
