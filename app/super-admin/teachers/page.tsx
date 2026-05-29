export const dynamic = "force-dynamic";

import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminTeachersPage() {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: { campus: true, teacherProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="All Teachers" />
      <DataTable
        data={teachers}
        emptyMessage="No teachers yet."
        columns={[
          {
            key: "code",
            label: "Code",
            render: (r) => r.teacherProfile?.teacherCode ?? "-",
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
                <Link href={`/admin/teachers/${r.id}`}>View</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
