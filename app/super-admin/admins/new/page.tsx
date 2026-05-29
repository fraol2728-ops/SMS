export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/admin/shared/PageHeader";
import { AdminForm } from "@/components/super-admin/AdminForm";
import { prisma } from "@/lib/prisma";

export default async function NewAdminPage() {
  const campuses = await prisma.campus.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Add campus admin" />
      <AdminForm campuses={campuses} />
    </div>
  );
}
