export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MailClient } from "@/components/admin/mail/MailClient";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function AdminMailPage() {
  await requireAdmin();
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!currentUser) redirect("/sign-in");
  const campusId = await getCurrentUserCampusId();
  const [inbox, sent, teachers, admins] = await Promise.all([
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
    prisma.user.findMany({
      where: { role: "TEACHER", campusId: campusId ?? undefined },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        campusId: campusId ?? undefined,
        NOT: { id: currentUser.id },
      },
      select: { id: true, firstName: true, lastName: true, role: true },
    }),
  ]);
  const contacts = [
    ...admins.map((a) => ({
      id: a.id,
      label: `${a.firstName} ${a.lastName} (${a.role})`,
    })),
    ...teachers.map((t) => ({
      id: t.id,
      label: `${t.firstName} ${t.lastName} (Teacher)`,
    })),
  ];
  const unreadCount = inbox.filter((m) => !m.isRead).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Mail</h1>
        <p className="text-gray-500 mt-1">
          Internal messaging with teachers
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </p>
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
