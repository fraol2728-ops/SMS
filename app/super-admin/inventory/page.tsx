export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Package } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminInventoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const labs = await prisma.lab.findMany({
    where: campusId ? { campusId } : {},
    include: {
      campus: { select: { name: true } },
      _count: { select: { assets: true } },
      assets: { select: { condition: true, category: true } },
    },
    orderBy: [{ campus: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Browse lab assets by campus" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => {
          const issues = lab.assets.filter((asset) =>
            ["DAMAGED", "MISSING", "UNDER_REPAIR"].includes(asset.condition),
          ).length;

          return (
            <Link
              key={lab.id}
              href={`/super-admin/inventory/${lab.id}?campusId=${campusId ?? ""}`}
            >
              <div className="rounded-xl border bg-white p-5 transition-all hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold dark:text-white">{lab.name}</p>
                    <p className="text-gray-400 text-xs">{lab.campus.name}</p>
                  </div>
                  <Package
                    size={18}
                    className={issues > 0 ? "text-red-500" : "text-gray-300"}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {lab._count.assets} assets
                  </span>
                  {issues > 0 ? (
                    <span className="text-red-600 text-xs">
                      ⚠️ {issues} issue{issues > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
        {labs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            No labs found for this campus
          </div>
        ) : null}
      </div>
    </div>
  );
}
