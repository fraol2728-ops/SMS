export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import type { ClassStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string; status?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { campusId, status: requestedStatus } = (await searchParams) ?? {};
  const status = requestedStatus ?? "STARTED";

  const classes = await prisma.class.findMany({
    where: {
      ...(campusId ? { campusId } : {}),
      status: status as ClassStatus,
      isActive: true,
    },
    include: {
      course: true,
      lab: true,
      teacher: { include: { user: true } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
  });

  const counts = await prisma.class.groupBy({
    by: ["status"],
    where: campusId ? { campusId } : {},
    _count: true,
  });

  const getCount = (classStatus: string) =>
    counts.find((count) => count.status === classStatus)?._count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        action={{
          label: "New Class",
          href: `/super-admin/classes/new?campusId=${campusId ?? ""}`,
        }}
      />
      <div className="flex flex-wrap gap-2">
        {[
          { id: "REGISTRATION", label: "Registration", emoji: "📋" },
          { id: "STARTED", label: "Started", emoji: "🚀" },
          { id: "ENDED", label: "Ended", emoji: "🏁" },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/super-admin/classes?campusId=${campusId ?? ""}&status=${tab.id}`}
          >
            <button
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-sm transition-all ${status === tab.id ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"}`}
              type="button"
            >
              {tab.emoji} {tab.label}
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {getCount(tab.id)}
              </span>
            </button>
          </Link>
        ))}
      </div>

      <div className="space-y-2 md:hidden">
        {classes.map((klass) => (
          <Link
            key={klass.id}
            href={`/super-admin/classes/${klass.id}?campusId=${campusId ?? ""}`}
          >
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold dark:text-white">
                    {klass.course.title}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {klass.lab?.name ?? "Online"}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600 text-xs dark:bg-gray-700 dark:text-gray-300">
                  {klass._count.enrollments}/{klass.capacity}
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 text-xs">
                  {TIME_SLOTS[klass.timeSlot]}
                </span>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700 text-xs">
                  {CLASS_DAYS[klass.days]}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {classes.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900">
            No {status.toLowerCase()} classes
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 md:block">
        <table className="w-full text-sm">
          <thead className="border-gray-200 border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              {[
                "Lab",
                "Course",
                "Teacher",
                "Time",
                "Days",
                "Students",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left font-medium text-gray-400 text-xs"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((klass) => (
              <tr
                key={klass.id}
                className="border-gray-200 border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-3 font-medium dark:text-white">
                  {klass.lab?.name ?? "Online"}
                </td>
                <td className="px-4 py-3 dark:text-white">
                  {klass.course.title}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {klass.teacher.user.firstName} {klass.teacher.user.lastName}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs dark:text-gray-400">
                  {TIME_SLOTS[klass.timeSlot]}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs dark:text-gray-400">
                  {CLASS_DAYS[klass.days]}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${klass._count.enrollments >= klass.capacity ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                  >
                    {klass._count.enrollments}/{klass.capacity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/super-admin/classes/${klass.id}?campusId=${campusId ?? ""}`}
                  >
                    <button
                      className="font-medium text-blue-600 text-xs hover:text-blue-800"
                      type="button"
                    >
                      View
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {classes.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            No {status.toLowerCase()} classes
          </div>
        ) : null}
      </div>
    </div>
  );
}
