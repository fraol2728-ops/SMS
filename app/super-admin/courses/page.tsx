export const dynamic = "force-dynamic";

import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminCoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { campusId } = (await searchParams) ?? {};
  const courses = await prisma.course.findMany({
    where: { campusId: campusId || undefined },
    include: { campus: true, _count: { select: { enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="All Courses" />
      <DataTable
        data={courses}
        emptyMessage="No courses yet."
        columns={[
          { key: "title", label: "Title" },
          { key: "campus", label: "Campus", render: (r) => r.campus.name },
          {
            key: "fee",
            label: "Fee",
            render: (r) => `ETB ${r.fee.toLocaleString()}`,
          },
          {
            key: "enrollments",
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
              <Button asChild size="sm" variant="outline">
                <Link href={`/super-admin/courses?campusId=${r.campusId}`}>
                  View
                </Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
