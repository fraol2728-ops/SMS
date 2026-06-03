export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AddAssetForm } from "@/components/admin/inventory/AddAssetForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireSuperAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminAddAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ labId: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  await requireSuperAdmin();
  const { labId } = await params;
  const { campusId } = (await searchParams) ?? {};
  const lab = await prisma.lab.findUnique({ where: { id: labId } });

  if (!lab) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Add asset to ${lab.name}`} />
      <AddAssetForm
        labId={lab.id}
        labName={lab.name}
        redirectBasePath="/super-admin/inventory"
        redirectQueryString={`?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
