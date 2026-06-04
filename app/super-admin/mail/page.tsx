export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MailClient } from "@/components/admin/mail/MailClient";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminMailPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { campusId } = (await searchParams) ?? {};

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!currentUser) redirect("/sign-in");

  const [inbox, sent] = await Promise.all([
    prisma.message.findMany({
      where: { receiverId: currentUser.id, parentId: null },
      include: {
        sender: { select: { firstName: true, lastName: true, role: true } },
        replies: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findMany({
      where: { senderId: currentUser.id, parentId: null },
      include: {
        receiver: { select: { firstName: true, lastName: true, role: true } },
        replies: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", campusId: campusId ?? undefined },
    select: { id: true, firstName: true, lastName: true },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", NOT: { id: currentUser.id } },
    select: { id: true, firstName: true, lastName: true, role: true },
  });

  const contacts = [
    ...admins.map((a) => ({
      id: a.id,
      label: `${a.firstName} ${a.lastName} (Admin)`,
    })),
    ...teachers.map((t) => ({
      id: t.id,
      label: `${t.firstName} ${t.lastName} (Teacher)`,
    })),
  ];

  const unreadCount = inbox.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-2xl dark:text-white">Mail</h1>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-white text-xs">
            {unreadCount} unread
          </span>
        ) : null}
      </div>
      <MailClient
        inbox={inbox}
        sent={sent}
        contacts={contacts}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
