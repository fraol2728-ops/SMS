export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AssetDetail } from "@/components/admin/inventory/AssetDetail";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireSuperAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminAssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ labId: string; assetId: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  await requireSuperAdmin();
  const { labId, assetId } = await params;
  const { campusId } = (await searchParams) ?? {};
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      lab: { include: { campus: true } },
      logs: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, role: true } },
        },
      },
    },
  });

  if (!asset || asset.labId !== labId) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={asset.name}
        description={`${asset.lab.name} • ${asset.lab.campus.name} Campus`}
      />
      <AssetDetail
        asset={asset}
        labId={labId}
        basePath="/super-admin/inventory"
        queryString={`?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
