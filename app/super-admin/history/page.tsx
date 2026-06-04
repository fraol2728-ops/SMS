export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { campusId } = (await searchParams) ?? {};

  const endedClasses = await prisma.class.findMany({
    where: { status: "ENDED", campusId: campusId ?? undefined },
    include: {
      course: true,
      lab: true,
      teacher: { include: { user: true } },
      _count: { select: { enrollments: true } },
      enrollments: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const query = campusId ? `?campusId=${campusId}` : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class History"
        description={`${endedClasses.length} ended classes`}
      />

      {endedClasses.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">📚</p>
          <p className="font-semibold dark:text-white">No ended classes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endedClasses.map((c) => {
            const completed = c.enrollments.filter(
              (e) => e.status === "COMPLETED",
            ).length;
            const dropped = c.enrollments.filter(
              (e) => e.status === "DROPPED",
            ).length;
            return (
              <Link key={c.id} href={`/super-admin/history/${c.id}${query}`}>
                <div className="rounded-xl border bg-white p-5 transition-all hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg dark:text-white">
                        {c.course.title}
                      </p>
                      <p className="text-gray-500 text-sm dark:text-gray-400">
                        {c.classType === "ONLINE" ? "🌐 Online" : c.lab?.name} •{" "}
                        {c.teacher.user.firstName} {c.teacher.user.lastName}
                      </p>
                      {c.startDate && c.endDate ? (
                        <p className="mt-0.5 text-gray-400 text-xs">
                          {new Date(c.startDate).toLocaleDateString("en-GB")} →{" "}
                          {new Date(c.endDate).toLocaleDateString("en-GB")}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="font-medium text-green-600">
                          {completed} completed
                        </span>
                        {dropped > 0 ? (
                          <span className="ml-2 text-red-500">
                            {dropped} dropped
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
