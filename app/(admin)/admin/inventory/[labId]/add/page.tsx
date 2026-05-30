export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AddAssetForm } from "@/components/admin/inventory/AddAssetForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function AddAssetPage({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  const { labId } = await params;
  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    include: { campus: true },
  });

  if (!lab) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Add asset to ${lab.name}`} />
      <AddAssetForm labId={lab.id} labName={lab.name} />
    </div>
  );
}
