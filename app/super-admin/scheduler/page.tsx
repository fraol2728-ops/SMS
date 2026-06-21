export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SchedulerClient } from "@/components/scheduler/SchedulerClient";
import { prisma } from "@/lib/prisma";

export default async function SchedulerPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  let canView = user.role === "SUPER_ADMIN";
  let canCreate = user.role === "SUPER_ADMIN";
  if (user.role !== "SUPER_ADMIN") {
    const access = await prisma.schedulerAccess.findUnique({
      where: { userId: user.id },
    });
    canView = access?.canView ?? false;
    canCreate = access?.canCreate ?? false;
  }
  if (!canView) redirect("/unauthorized");

  const [channels, posts] = await Promise.all([
    prisma.telegramChannel.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.scheduledPost.findMany({
      where: {
        scheduledFor: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        channel: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledFor: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduler"
        description="Schedule and manage Telegram posts"
      />
      <SchedulerClient
        channels={channels}
        posts={posts}
        canCreate={canCreate}
        isSuperAdmin={user.role === "SUPER_ADMIN"}
      />
    </div>
  );
}
