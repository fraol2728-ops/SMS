import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable } from "@/components/admin/shared/DataTable";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();
  const c = await prisma.course.findFirst({
    where: { id, ...(campusId ? { campusId } : {}) },
    include: {
      enrollments: { include: { student: { include: { user: true } } } },
      classes: { include: { teacher: { include: { user: true } } } },
    },
  });
  if (!c) notFound();
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">{c.title}</h1>
            <Button asChild>
              <Link href={`/admin/courses/${id}/edit`}>Edit</Link>
            </Button>
          </div>
          <p>{c.classType}</p>
          <p>{c.durationWeeks} weeks</p>
          <p>ETB {c.fee.toLocaleString()}</p>
          <StatusBadge status={c.isActive ? "ACTIVE" : "CANCELLED"} />
          <p>{c.description}</p>
        </CardContent>
      </Card>
      <DataTable
        data={c.enrollments.filter(
          (e: (typeof c.enrollments)[number]) => e.status === "ACTIVE",
        )}
        columns={[
          {
            key: "student",
            label: "Student name",
            render: (r) =>
              `${r.student.user.firstName} ${r.student.user.lastName}`,
          },
          {
            key: "createdAt",
            label: "Enrolled date",
            render: (r) => r.createdAt.toLocaleDateString(),
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
        ]}
      />
      <DataTable
        data={c.classes}
        columns={[
          {
            key: "teacher",
            label: "Teacher",
            render: (r) =>
              `${r.teacher.user.firstName} ${r.teacher.user.lastName}`,
          },
          { key: "labName", label: "Lab" },
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
