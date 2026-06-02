export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/admin/shared/PageHeader";
import { TaskBoard } from "@/components/admin/tasks/TaskBoard";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUser, getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function AdminTasksPage() {
  await requireAdmin();
  const currentUser = await getCurrentUser();
  const campusId = await getCurrentUserCampusId();
  const [tasks, teachers, admins] = await Promise.all([
    prisma.task.findMany({
      where: { campusId: campusId ?? undefined },
      include: {
        createdBy: { select: { firstName: true, lastName: true, role: true } },
        assignee: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      where: { role: "TEACHER", campusId: campusId ?? undefined },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        campusId: campusId ?? undefined,
      },
      select: { id: true, firstName: true, lastName: true, role: true },
    }),
  ]);
  const assignees = [
    ...admins.map((a) => ({
      ...a,
      label: `${a.firstName} ${a.lastName} (Admin)`,
    })),
    ...teachers.map((t) => ({
      ...t,
      label: `${t.firstName} ${t.lastName} (Teacher)`,
    })),
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage and assign tasks to teachers and admins"
      />
      <TaskBoard
        tasks={tasks}
        assignees={assignees}
        currentUserId={currentUser?.id ?? ""}
      />
    </div>
  );
}
