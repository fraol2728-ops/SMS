"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ASSET_CATEGORIES, ASSET_CONDITIONS } from "@/lib/constants";

const CONDITION_COLORS: Record<string, string> = {
  GOOD: "bg-green-100 text-green-700",
  FAIR: "bg-blue-100 text-blue-700",
  DAMAGED: "bg-red-100 text-red-700",
  UNDER_REPAIR: "bg-amber-100 text-amber-700",
  MISSING: "bg-purple-100 text-purple-700",
  RETIRED: "bg-gray-100 text-gray-500",
};

type AssetRow = {
  id: string;
  name: string;
  serialNumber: string | null;
  condition: string;
  notes: string | null;
  logs?: {
    action: string;
    createdAt: Date | string;
    user: { firstName: string; lastName: string };
  }[];
};

export function AssetList({
  labId,
  assetsByCategory,
  totalAssets,
}: {
  labId: string;
  assetsByCategory: Record<string, AssetRow[]>;
  totalAssets: number;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(assetsByCategory)),
  );
  const [search, setSearch] = useState("");

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  if (totalAssets === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <p className="mb-4 text-muted-foreground">
          No assets recorded for this lab yet.
        </p>
        <Button asChild>
          <Link href={`/admin/inventory/${labId}/add`}>Add first asset</Link>
        </Button>
      </div>
    );
  }

  const categories = Object.keys(assetsByCategory);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name or serial number..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="h-10 w-full rounded-md border bg-white px-3 text-sm"
      />

      {categories.map((category) => {
        const assets = assetsByCategory[category].filter(
          (asset) =>
            search === "" ||
            asset.name.toLowerCase().includes(search.toLowerCase()) ||
            (asset.serialNumber?.toLowerCase() ?? "").includes(
              search.toLowerCase(),
            ),
        );
        if (assets.length === 0) return null;

        const isExpanded = expandedCategories.has(category);
        const categoryLabel =
          ASSET_CATEGORIES[category as keyof typeof ASSET_CATEGORIES] ??
          category;
        const damagedInCategory = assets.filter(
          (asset) =>
            asset.condition === "DAMAGED" || asset.condition === "MISSING",
        ).length;

        return (
          <div
            key={category}
            className="overflow-hidden rounded-xl border bg-white"
          >
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
                <span className="font-semibold">{categoryLabel}</span>
                <span className="text-muted-foreground text-sm">
                  ({assets.length} items)
                </span>
                {damagedInCategory > 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 text-xs">
                    {damagedInCategory} issue{damagedInCategory > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </button>

            {isExpanded ? (
              <div className="overflow-x-auto border-t">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
                        #
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
                        Name / Model
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
                        Serial Number
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
                        Condition
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
                        Last Updated
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset, index) => {
                      const lastLog = asset.logs?.[0];
                      return (
                        <tr
                          key={asset.id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{asset.name}</p>
                            {asset.notes ? (
                              <p className="text-muted-foreground text-xs">
                                {asset.notes}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            {asset.serialNumber ? (
                              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                                {asset.serialNumber}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 font-medium text-xs ${
                                CONDITION_COLORS[asset.condition] ??
                                "bg-gray-100"
                              }`}
                            >
                              {ASSET_CONDITIONS[
                                asset.condition as keyof typeof ASSET_CONDITIONS
                              ] ?? asset.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {lastLog ? (
                              <div>
                                <p>{lastLog.action}</p>
                                <p>
                                  by {lastLog.user.firstName}{" "}
                                  {lastLog.user.lastName}
                                </p>
                                <p>
                                  {new Date(
                                    lastLog.createdAt,
                                  ).toLocaleDateString("en-GB")}
                                </p>
                              </div>
                            ) : (
                              <span>Just added</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={`/admin/inventory/${labId}/assets/${asset.id}`}
                              >
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
