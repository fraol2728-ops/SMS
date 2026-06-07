export const dynamic = "force-dynamic";

import { AdminFeedbackClient } from "@/components/admin/feedback/AdminFeedbackClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireSuperAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminFeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  await requireSuperAdmin();
  const { campusId } = (await searchParams) ?? {};

  const feedbacks = await prisma.studentFeedback.findMany({
    where: {
      class: campusId ? { campusId } : undefined,
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
      class: {
        include: {
          course: true,
          lab: true,
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rated = feedbacks.filter((f) => f.rating !== null);
  const avgRating =
    rated.length > 0
      ? (
          rated.reduce((sum, f) => sum + (f.rating ?? 0), 0) / rated.length
        ).toFixed(1)
      : null;

  const problemCounts: Record<string, number> = {};
  feedbacks.forEach((f) => {
    f.problemsReported.forEach((p) => {
      problemCounts[p] = (problemCounts[p] ?? 0) + 1;
    });
  });
  const topProblems = Object.entries(problemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader title="Student Feedback" description="All campus feedback" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="font-black text-3xl dark:text-white">
            {feedbacks.length}
          </p>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            Total Feedback
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="font-black text-3xl text-amber-500">
            {avgRating ? `${avgRating} ★` : "—"}
          </p>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            Average Rating
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:col-span-1">
          <p className="mb-2 font-bold text-gray-700 text-sm dark:text-gray-300">
            Top Issues
          </p>
          {topProblems.length === 0 ? (
            <p className="text-gray-400 text-xs">No problems reported</p>
          ) : (
            <div className="space-y-1">
              {topProblems.map(([problem, count]) => (
                <div
                  key={problem}
                  className="flex items-center justify-between"
                >
                  <p className="flex-1 truncate text-amber-700 text-xs dark:text-amber-400">
                    {problem}
                  </p>
                  <span className="ml-2 font-bold text-amber-600 text-xs">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminFeedbackClient feedbacks={feedbacks} />
    </div>
  );
}
