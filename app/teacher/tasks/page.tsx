export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TeacherTaskList } from "@/components/teacher/tasks/TeacherTaskList";
import { prisma } from "@/lib/prisma";

export default async function TeacherTasksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!teacher) redirect("/sign-in");
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: teacher.id,
      OR: [
        { status: { not: "COMPLETED" } },
        { status: "COMPLETED", completedAt: { gte: oneWeekAgo } },
      ],
    },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
  const pendingCount = tasks.filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS",
  ).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Tasks
        </h1>
        <p className="text-gray-500 mt-1">
          {pendingCount} pending task{pendingCount !== 1 ? "s" : ""}
        </p>
      </div>
      <TeacherTaskList tasks={tasks} />
    </div>
  );
}
