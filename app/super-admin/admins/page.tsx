export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/admin/shared/PageHeader";
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
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-lg text-white ${admin.role === "SUPER_ADMIN" ? "bg-purple-600" : "bg-blue-600"}`}
              >
                {admin.firstName[0]}
                {admin.lastName[0]}
              </div>
              <div>
                <p className="font-semibold dark:text-white">
                  {admin.firstName} {admin.lastName}
                </p>
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
          </div>
        ))}
      </div>
    </div>
  );
}
