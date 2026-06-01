export const dynamic = "force-dynamic";

import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { campusId } = (await searchParams) ?? {};
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", campusId: campusId || undefined },
    include: { campus: true, studentProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="All Students" />
      <DataTable
        data={students}
        emptyMessage="No students yet."
        columns={[
          {
            key: "code",
            label: "Code",
            render: (r) => r.studentProfile?.studentCode ?? "-",
          },
          {
            key: "name",
            label: "Name",
            render: (r) => `${r.firstName} ${r.lastName}`,
          },
          { key: "email", label: "Email" },
          {
            key: "campus",
            label: "Campus",
            render: (r) => r.campus?.name ?? "Unassigned",
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/students/${r.id}`}>View</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
