export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MailClient } from "@/components/admin/mail/MailClient";
import { prisma } from "@/lib/prisma";

export default async function TeacherMailPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");
  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, campusId: true },
  });
  if (!currentUser) redirect("/sign-in");
  const [inbox, sent, admins] = await Promise.all([
    prisma.message.findMany({
      where: {
        receiverId: currentUser.id,
        parentId: null,
        sender: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      },
      include: {
        sender: { select: { firstName: true, lastName: true, role: true } },
        replies: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.findMany({
      where: {
        senderId: currentUser.id,
        parentId: null,
        receiver: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      },
      include: {
        receiver: { select: { firstName: true, lastName: true, role: true } },
        replies: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        campusId: currentUser.campusId ?? undefined,
      },
      select: { id: true, firstName: true, lastName: true, role: true },
    }),
  ]);
  const contacts = admins.map((a) => ({
    id: a.id,
    label: `${a.firstName} ${a.lastName} (${a.role})`,
  }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Mail</h1>
        <p className="text-gray-500 mt-1">Internal messaging with admins</p>
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
