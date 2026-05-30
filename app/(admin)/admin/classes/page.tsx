import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const campusId = await getCurrentUserCampusId();

  const classes = await prisma.class.findMany({
    where: campusId ? { campusId } : {},
    include: {
      course: true,
      teacher: { include: { user: true } },
      campus: true,
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ labName: "asc" }, { timeSlot: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        action={{ label: "Add class", href: "/admin/classes/new" }}
      />
      <DataTable
        data={classes}
        emptyMessage="No classes yet. Create a class to start enrolling students."
        columns={[
          { key: "lab", label: "Lab", render: (r) => r.labName },
          { key: "course", label: "Course", render: (r) => r.course.title },
          {
            key: "teacher",
            label: "Teacher",
            render: (r) =>
              `${r.teacher.user.firstName} ${r.teacher.user.lastName}`,
          },
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
          {
            key: "students",
            label: "Students",
            render: (r) => `${r._count.enrollments} / ${r.capacity}`,
          },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <Badge variant={r.isActive ? "default" : "secondary"}>
                {r.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
