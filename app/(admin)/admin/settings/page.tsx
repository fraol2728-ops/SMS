export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/admin/settings/SettingsClient";
import { getAdminSettings } from "@/lib/actions/settings";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  await requireAdmin();
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const [dbUser, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId },
      include: { campus: true },
    }),
    getAdminSettings(),
  ]);

  if (!dbUser) redirect("/sign-in");

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-gray-500">
          Manage your account and preferences
        </p>
      </div>
      <SettingsClient settings={settings} user={dbUser} />
    </div>
  );
}
