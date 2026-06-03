export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { CampusEditClient } from "@/components/super-admin/CampusEditClient";
import { requireSuperAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function EditCampusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const campus = await prisma.campus.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: { where: { role: "STUDENT" } },
          classes: true,
          labs: true,
        },
      },
    },
  });

  if (!campus) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={`Edit ${campus.name}`} />
      <CampusEditClient campus={campus} />
    </div>
  );
}
