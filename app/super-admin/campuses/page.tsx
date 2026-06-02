export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminCampusesPage() {
  const campuses = await prisma.campus.findMany({
    include: {
      _count: {
        select: {
          users: { where: { role: "STUDENT" } },
          labs: true,
          classes: { where: { isActive: true, status: "STARTED" } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const campusColors: Record<string, string> = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    red: "bg-red-600",
    amber: "bg-amber-500",
    rose: "bg-rose-600",
    indigo: "bg-indigo-600",
    teal: "bg-teal-600",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Management"
        description="Manage all training center campuses"
        action={{ label: "Add Campus", href: "/super-admin/campuses/new" }}
      />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {campuses.map((campus) => (
          <div
            key={campus.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          >
            <div
              className={`${campusColors[campus.color] ?? "bg-blue-600"} p-5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 font-bold text-lg text-white">
                    {campus.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">
                      {campus.name}
                    </h3>
                    <p className="text-sm text-white/70">{campus.location}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 font-medium text-xs ${campus.isActive ? "bg-white/20 text-white" : "bg-red-500/30 text-red-200"}`}
                >
                  {campus.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Students", value: campus._count.users },
                  { label: "Classes", value: campus._count.classes },
                  { label: "Labs", value: campus._count.labs },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-800"
                  >
                    <p className="font-bold text-xl text-gray-900 dark:text-white">
                      {value}
                    </p>
                    <p className="text-gray-400 text-xs">{label}</p>
                  </div>
                ))}
              </div>
              <Link href={`/super-admin/campuses/${campus.id}/edit`}>
                <button
                  className="w-full rounded-xl border border-gray-200 py-2 text-gray-600 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  type="button"
                >
                  Edit Campus
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
