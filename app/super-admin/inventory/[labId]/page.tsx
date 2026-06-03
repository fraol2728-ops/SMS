export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssetList } from "@/components/admin/inventory/AssetList";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminLabInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ labId: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { labId } = await params;
  const { campusId } = (await searchParams) ?? {};

  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    include: {
      campus: true,
      assets: {
        include: {
          logs: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!lab) notFound();

  const assetsByCategory = lab.assets.reduce(
    (acc, asset) => {
      const category = String(asset.category);
      if (!acc[category]) acc[category] = [];
      acc[category].push(asset);
      return acc;
    },
    {} as Record<string, typeof lab.assets>,
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/super-admin/inventory?campusId=${campusId ?? ""}`}
        className="inline-flex text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        ← Back to Inventory
      </Link>

      <PageHeader
        title={`${lab.name} — Inventory`}
        description={`${lab.campus.name} Campus`}
        action={{
          label: "Add Asset",
          href: `/super-admin/inventory/${lab.id}/add?campusId=${campusId ?? ""}`,
        }}
      />

      <AssetList
        labId={lab.id}
        assetsByCategory={assetsByCategory}
        totalAssets={lab.assets.length}
        basePath="/super-admin/inventory"
        queryString={`?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
