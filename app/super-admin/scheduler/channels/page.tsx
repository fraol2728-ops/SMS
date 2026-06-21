export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { ChannelForm } from "@/components/scheduler/ChannelForm";
import { prisma } from "@/lib/prisma";

export default async function ChannelsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (user?.role !== "SUPER_ADMIN") redirect("/unauthorized");
  const [channels, campuses] = await Promise.all([
    prisma.telegramChannel.findMany({ include: { campus: true } }),
    prisma.campus.findMany(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Telegram Channels"
        description="Connect bots and channels"
      />
      <ChannelForm campuses={campuses} />
      <div className="space-y-3">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold dark:text-white">{ch.name}</p>
              <p className="text-xs text-gray-400">
                {ch.campus?.name ?? "All campuses"} • Chat ID: {ch.chatId}
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full ${ch.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
            >
              {ch.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
