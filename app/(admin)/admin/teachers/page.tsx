import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const rows = await prisma.user.findMany({
    where: { role: "TEACHER", ...(campusId ? { campusId } : {}) },
    include: { teacherProfile: { include: { classes: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        action={{ label: "Add teacher", href: "/admin/teachers/new" }}
      />
      <DataTable
        data={rows}
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
            key: "specialty",
            label: "Specialty",
            render: (r) => r.teacherProfile?.specialty ?? "-",
          },
          {
            key: "classes",
            label: "Classes count",
            render: (r) => r.teacherProfile?.classes.length ?? 0,
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/teachers/${r.id}`}>View</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/teachers/${r.id}/edit`}>Edit</Link>
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
