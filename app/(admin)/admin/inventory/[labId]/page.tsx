export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AssetList } from "@/components/admin/inventory/AssetList";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function LabInventoryPage({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  await requireAdmin();
  const { labId } = await params;
  const lab = (await prisma.lab.findUnique({
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
      classes: {
        where: { isActive: true },
        include: { course: true },
      },
    },
  })) as {
    id: string;
    name: string;
    campus: { name: string };
    assets: {
      id: string;
      name: string;
      serialNumber: string | null;
      category: string;
      condition: string;
      notes: string | null;
      logs: {
        action: string;
        createdAt: Date;
        user: { firstName: string; lastName: string };
      }[];
    }[];
    classes: { id: string; course: { title: string } }[];
  } | null;

  if (!lab) notFound();

  const totalAssets = lab.assets.length;
  const goodAssets = lab.assets.filter(
    (asset) => asset.condition === "GOOD",
  ).length;
  const damagedAssets = lab.assets.filter(
    (asset) => asset.condition === "DAMAGED",
  ).length;
  const underRepair = lab.assets.filter(
    (asset) => asset.condition === "UNDER_REPAIR",
  ).length;
  const missingAssets = lab.assets.filter(
    (asset) => asset.condition === "MISSING",
  ).length;

  const assetsByCategory = lab.assets.reduce(
    (acc, asset) => {
      if (!acc[asset.category]) acc[asset.category] = [];
      acc[asset.category].push(asset);
      return acc;
    },
    {} as Record<string, typeof lab.assets>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${lab.name} — Inventory`}
        description={`${lab.campus.name} Campus`}
        action={{ label: "Add asset", href: `/admin/inventory/${lab.id}/add` }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          {
            label: "Total Assets",
            value: totalAssets,
            color: "bg-gray-50 text-gray-700",
          },
          {
            label: "Good Condition",
            value: goodAssets,
            color: "bg-green-50 text-green-700",
          },
          {
            label: "Damaged",
            value: damagedAssets,
            color: "bg-red-50 text-red-700",
          },
          {
            label: "Under Repair",
            value: underRepair,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Missing",
            value: missingAssets,
            color: "bg-purple-50 text-purple-700",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color.split(" ")[0]}`}>
            <p className={`font-bold text-2xl ${color.split(" ")[1]}`}>
              {value}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">{label}</p>
          </div>
        ))}
      </div>

      {lab.classes.length > 0 ? (
        <div className="rounded-xl border bg-white p-4">
          <p className="mb-2 font-medium text-sm">
            Active classes in this lab:
          </p>
          <div className="flex flex-wrap gap-2">
            {lab.classes.map((classRecord) => (
              <Badge key={classRecord.id} variant="secondary">
                {classRecord.course.title}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <AssetList
        labId={lab.id}
        assetsByCategory={assetsByCategory}
        totalAssets={totalAssets}
      />
    </div>
  );
}
