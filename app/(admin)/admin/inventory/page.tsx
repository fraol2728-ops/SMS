export const dynamic = "force-dynamic";

import { Package } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const campusId = await getCurrentUserCampusId();

  const labs = (await prisma.lab.findMany({
    where: {
      campusId: campusId ?? undefined,
      isActive: true,
    },
    include: {
      campus: { select: { name: true } },
      _count: { select: { assets: true } },
      assets: {
        select: { condition: true, category: true },
      },
      classes: {
        where: { isActive: true },
        select: { id: true },
      },
    },
    orderBy: [{ campus: { name: "asc" } }, { name: "asc" }],
  })) as {
    id: string;
    name: string;
    campus: { name: string };
    _count: { assets: number };
    assets: { condition: string; category: string }[];
    classes: { id: string }[];
  }[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track lab assets across all campuses"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => {
          const totalAssets = lab._count.assets;
          const damagedCount = lab.assets.filter(
            (asset) =>
              asset.condition === "DAMAGED" ||
              asset.condition === "MISSING" ||
              asset.condition === "UNDER_REPAIR",
          ).length;
          const computerCount = lab.assets.filter(
            (asset) => asset.category === "COMPUTER",
          ).length;
          const activeClasses = lab.classes.length;

          return (
            <Link key={lab.id} href={`/admin/inventory/${lab.id}`}>
              <div className="cursor-pointer rounded-xl border bg-white p-5 transition-all hover:border-blue-300 hover:shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{lab.name}</h3>
                    <p className="text-muted-foreground text-xs">
                      {lab.campus.name} Campus
                    </p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      damagedCount > 0 ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    <Package
                      size={20}
                      className={
                        damagedCount > 0 ? "text-red-500" : "text-green-500"
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="font-bold text-xl">{totalAssets}</p>
                    <p className="text-muted-foreground text-xs">
                      Total Assets
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2">
                    <p className="font-bold text-blue-700 text-xl">
                      {computerCount}
                    </p>
                    <p className="text-muted-foreground text-xs">Computers</p>
                  </div>
                  <div
                    className={`rounded-lg p-2 ${
                      damagedCount > 0 ? "bg-red-50" : "bg-gray-50"
                    }`}
                  >
                    <p
                      className={`font-bold text-xl ${
                        damagedCount > 0 ? "text-red-600" : ""
                      }`}
                    >
                      {damagedCount}
                    </p>
                    <p className="text-muted-foreground text-xs">Issues</p>
                  </div>
                </div>

                {activeClasses > 0 ? (
                  <p className="mt-3 text-muted-foreground text-xs">
                    {activeClasses} active class{activeClasses > 1 ? "es" : ""}
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
