export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminInventoryPage() {
  const labs = (await prisma.lab.findMany({
    include: {
      campus: true,
      _count: { select: { assets: true } },
      assets: { select: { condition: true } },
    },
    orderBy: [{ campus: { name: "asc" } }, { name: "asc" }],
  })) as {
    id: string;
    name: string;
    campus: { name: string };
    _count: { assets: number };
    assets: { condition: string }[];
  }[];

  const totalAssets = labs.reduce((sum, lab) => sum + lab._count.assets, 0);
  const totalIssues = labs.reduce(
    (sum, lab) =>
      sum +
      lab.assets.filter((asset) =>
        ["DAMAGED", "MISSING", "UNDER_REPAIR"].includes(asset.condition),
      ).length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory — All Campuses" />

      <div className="grid max-w-sm grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="font-bold text-2xl">{totalAssets}</p>
          <p className="text-muted-foreground text-sm">Total Assets</p>
        </div>
        <div className="rounded-xl border bg-red-50 p-4">
          <p className="font-bold text-2xl text-red-700">{totalIssues}</p>
          <p className="text-muted-foreground text-sm">Issues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => {
          const issues = lab.assets.filter((asset) =>
            ["DAMAGED", "MISSING", "UNDER_REPAIR"].includes(asset.condition),
          ).length;
          return (
            <Link key={lab.id} href={`/admin/inventory/${lab.id}`}>
              <div className="rounded-xl border bg-white p-4 transition-all hover:border-blue-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{lab.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {lab.campus.name}
                    </p>
                  </div>
                  <span className="font-medium text-sm">
                    {lab._count.assets} assets
                  </span>
                </div>
                {issues > 0 ? (
                  <p className="mt-2 text-red-600 text-xs">
                    ⚠️ {issues} issue{issues > 1 ? "s" : ""} reported
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
