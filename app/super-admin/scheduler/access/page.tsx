export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { AccessClient } from "@/components/scheduler/AccessClient";
import { getSchedulerAccessList } from "@/lib/actions/telegram";
import { prisma } from "@/lib/prisma";

export default async function SchedulerAccessPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (user?.role !== "SUPER_ADMIN") redirect("/unauthorized");
  const users = await getSchedulerAccessList();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduler Access"
        description="Grant Admins and Teachers access to the Scheduler"
      />
      <AccessClient users={users} />
    </div>
  );
}
