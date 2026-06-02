export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { firstName: true, lastName: true, email: true, role: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl dark:text-white">System Settings</h1>
        <p className="mt-1 text-gray-500">Super admin configuration</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 font-semibold dark:text-white">Account</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              label: "Name",
              value:
                `${dbUser?.firstName ?? ""} ${dbUser?.lastName ?? ""}`.trim() ||
                "—",
            },
            { label: "Email", value: dbUser?.email ?? "—" },
            { label: "Role", value: dbUser?.role ?? "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
            >
              <p className="mb-1 text-gray-400 text-xs">{label}</p>
              <p className="font-medium text-sm dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-2 font-semibold dark:text-white">Danger Zone</h2>
        <p className="mb-4 text-gray-400 text-sm">
          Irreversible actions. Use with caution.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-red-200 p-4 dark:border-red-900">
            <div>
              <p className="font-medium text-red-700 text-sm dark:text-red-400">
                Reset campus data
              </p>
              <p className="text-gray-400 text-xs">
                Remove all students and classes for a campus
              </p>
            </div>
            <button
              className="rounded-xl bg-red-50 px-4 py-2 text-red-700 text-sm transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
