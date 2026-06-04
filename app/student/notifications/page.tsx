export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/student/NotificationsClient";
import { prisma } from "@/lib/prisma";

export default async function StudentNotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!student) redirect("/sign-in");

  const notifications = await prisma.studentNotification.findMany({
    where: { studentId: student.id },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });

  await prisma.studentNotification.updateMany({
    where: { studentId: student.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">
          {notifications.length} notification
          {notifications.length !== 1 ? "s" : ""}
        </p>
      </div>
      <NotificationsClient notifications={notifications} />
    </div>
  );
}
