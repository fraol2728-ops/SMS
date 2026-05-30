import { ScheduleForm } from "@/components/admin/schedules/ScheduleForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function NewSchedulePage() {
  const campusId = await getCurrentUserCampusId();
  const [courses, teachers] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true, ...(campusId ? { campusId } : {}) },
    }),
    prisma.teacherProfile.findMany({
      where: campusId ? { user: { campusId } } : undefined,
      include: { user: true },
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Add schedule" />
      <ScheduleForm courses={courses} teachers={teachers} />
    </div>
  );
}
