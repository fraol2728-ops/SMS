export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TeacherPerformanceCard } from "@/components/shared/TeacherPerformanceCard";
import { getTeacherPerformance } from "@/lib/actions/performance";
import { requireTeacher } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function TeacherPerformancePage() {
  await requireTeacher();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { teacherProfile: true },
  });
  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const performance = await getTeacherPerformance(teacher.teacherProfile.id);
  const message =
    performance.grade === "Excellent"
      ? "Outstanding work — your students are thriving."
      : performance.grade === "Good"
        ? "Great momentum — keep building on your strengths."
        : performance.grade === "Average"
          ? "You are making progress; focus on the highlighted insights."
          : "Every improvement starts with one focused step. You’ve got this.";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">
          My Performance
        </p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Teacher Performance Score
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>
      </div>
      <TeacherPerformanceCard performance={performance} />
    </div>
  );
}
