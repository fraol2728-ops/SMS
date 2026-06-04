export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminDroppedPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const droppedEnrollments = await prisma.enrollment.findMany({
    where: {
      status: "DROPPED",
      class: campusId ? { campusId } : undefined,
    },
    include: {
      student: { include: { user: true } },
      class: { include: { course: true, lab: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dropped Students"
        description={`${droppedEnrollments.length} dropped student${droppedEnrollments.length !== 1 ? "s" : ""}`}
      />

      {droppedEnrollments.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">✅</p>
          <p className="font-semibold dark:text-white">No dropped students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {droppedEnrollments.map((enrollment) => {
            const user = enrollment.student.user;
            return (
              <Link
                key={enrollment.id}
                href={`/super-admin/dropped/${enrollment.id}?campusId=${campusId ?? ""}`}
              >
                <div className="rounded-xl border border-red-100 bg-white p-5 transition-all hover:border-red-300 dark:border-red-900/30 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 font-bold text-red-700 dark:bg-red-900/30">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-gray-500 text-sm dark:text-gray-400">
                          {enrollment.class?.course.title}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-red-700 text-xs dark:bg-red-900/30 dark:text-red-400">
                      Dropped
                    </span>
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
