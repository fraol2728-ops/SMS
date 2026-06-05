export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { AdminCardMenu } from "@/components/super-admin/AdminCardMenu";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminAdminsPage() {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    include: { campus: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Admins"
        description="Manage campus administrators"
        action={{ label: "Add Admin", href: "/super-admin/admins/new" }}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="group relative rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
          >
            <Link
              href={`/super-admin/admins/${admin.id}`}
              className="block"
            >
              <div className="mb-4 flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-lg text-white ${admin.role === "SUPER_ADMIN" ? "bg-purple-600" : "bg-blue-600"}`}
                >
                  {admin.firstName[0]}
                  {admin.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold dark:text-white">
                      {admin.firstName} {admin.lastName}
                    </p>
                    {!admin.isActive && (
                      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Blocked
                      </span>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${admin.role === "SUPER_ADMIN" ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}
                  >
                    {admin.role}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-gray-500 text-sm dark:text-gray-400">
                <p>
                  📧 {admin.email.includes("@exceed.local") ? "—" : admin.email}
                </p>
                <p>📱 {admin.phone ?? "—"}</p>
                <p>🏫 {admin.campus?.name ?? "All Campuses"}</p>
              </div>
            </Link>
            <AdminCardMenu adminId={admin.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
