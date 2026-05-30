import { notFound } from "next/navigation";
import { DataTable } from "@/components/admin/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();
  const t = await prisma.user.findFirst({
    where: { id, ...(campusId ? { campusId } : {}) },
    include: {
      teacherProfile: {
        include: {
          classes: {
            include: { course: true, lab: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!t) notFound();
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">
            {t.firstName} {t.lastName}
          </h1>
          <p>{t.email}</p>
          <p>{t.teacherProfile?.specialty}</p>
          <p>{t.teacherProfile?.bio}</p>
        </CardContent>
      </Card>
      <DataTable
        data={t.teacherProfile?.classes ?? []}
        columns={[
          { key: "course", label: "Course", render: (r) => r.course.title },
          { key: "lab", label: "Lab", render: (r) => r.lab.name },
          {
            key: "timeSlot",
            label: "Time",
            render: (r) => TIME_SLOTS[r.timeSlot as keyof typeof TIME_SLOTS],
          },
          {
            key: "days",
            label: "Days",
            render: (r) => CLASS_DAYS[r.days as keyof typeof CLASS_DAYS],
          },
          { key: "capacity", label: "Capacity" },
        ]}
      />
    </div>
  );
}
