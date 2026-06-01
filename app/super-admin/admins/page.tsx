export const dynamic = "force-dynamic";

import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function AdminsPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { campusId } = (await searchParams) ?? {};
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", campusId: campusId || undefined },
    include: { campus: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Admins"
        action={{ label: "Add admin", href: "/super-admin/admins/new" }}
      />
      <DataTable
        data={admins}
        emptyMessage="No campus admins yet."
        columns={[
          {
            key: "name",
            label: "Name",
            render: (r) => `${r.firstName} ${r.lastName}`,
          },
          { key: "email", label: "Email", render: (r) => r.email },
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
                <Link href={`/super-admin/admins/${r.id}`}>View</Link>
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
