export const dynamic = "force-dynamic";

import { NotificationComposer } from "@/components/admin/notifications/NotificationComposer";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();

  const sentNotifications = await prisma.studentNotification.findMany({
    where: { campusId: campusId ?? undefined },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const classes = await prisma.class.findMany({
    where: {
      campusId: campusId ?? undefined,
      isActive: true,
      status: "STARTED",
    },
    include: { course: true, lab: true },
    orderBy: { lab: { name: "asc" } },
  });

  const totalStudents = await prisma.user.count({
    where: { role: "STUDENT", campusId: campusId ?? undefined },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Send announcements to students"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotificationComposer classes={classes} totalStudents={totalStudents} />
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl p-6">
          <h2 className="font-semibold dark:text-white mb-4">
            Recently Sent ({sentNotifications.length})
          </h2>
          {sentNotifications.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No notifications sent yet
            </p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {sentNotifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <p className="font-medium text-sm dark:text-white">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
