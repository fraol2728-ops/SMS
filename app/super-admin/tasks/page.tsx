export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { TaskBoard } from "@/components/admin/tasks/TaskBoard";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminTasksPage({
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

  const tasks = await prisma.task.findMany({
    where: { campusId: campusId ?? undefined },
    include: {
      createdBy: { select: { firstName: true, lastName: true, role: true } },
      assignee: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", campusId: campusId ?? undefined },
    select: { id: true, firstName: true, lastName: true },
  });

  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
      campusId: campusId ?? undefined,
    },
    select: { id: true, firstName: true, lastName: true, role: true },
  });

  const assignees = [
    ...admins.map((a) => ({
      ...a,
      label: `${a.firstName} ${a.lastName} (${a.role})`,
    })),
    ...teachers.map((t) => ({
      ...t,
      label: `${t.firstName} ${t.lastName} (Teacher)`,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" />
      <TaskBoard
        tasks={tasks}
        assignees={assignees}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
