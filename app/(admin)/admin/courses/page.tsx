import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const campusId = await getCurrentUserCampusId();
  const courses = await prisma.course.findMany({
    where: campusId ? { campusId } : undefined,
    include: { _count: { select: { enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        action={{ label: "Add course", href: "/admin/courses/new" }}
      />
      <DataTable
        data={courses}
        columns={[
          {
            key: "title",
            label: "Title",
            render: (r) => (
              <Link href={`/admin/courses/${r.id}`}>{r.title}</Link>
            ),
          },
          {
            key: "classType",
            label: "Type",
            render: (r) => <Badge variant="secondary">{r.classType}</Badge>,
          },
          {
            key: "durationWeeks",
            label: "Duration",
            render: (r) => `${r.durationWeeks} weeks`,
          },
          {
            key: "fee",
            label: "Fee",
            render: (r) => `ETB ${r.fee.toLocaleString()}`,
          },
          {
            key: "_count",
            label: "Enrollments",
            render: (r) => r._count.enrollments,
          },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <StatusBadge status={r.isActive ? "ACTIVE" : "CANCELLED"} />
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <div className="space-x-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/courses/${r.id}`}>View</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/courses/${r.id}/edit`}>Edit</Link>
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
