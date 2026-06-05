export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminCoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const courses = await prisma.course.findMany({
    where: campusId ? { campusId } : {},
    include: {
      _count: { select: { classes: true } },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        action={{
          label: "Add Course",
          href: `/super-admin/courses/new?campusId=${campusId ?? ""}`,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="font-semibold dark:text-white">{course.title}</h3>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  course.isActive
                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-700"
                }`}
              >
                {course.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="space-y-1 text-gray-500 text-sm dark:text-gray-400">
              <p>📅 {course.durationWeeks} weeks</p>
              <p>💰 ETB {course.fee.toLocaleString()}</p>
              <p>📚 {course._count.classes} classes</p>
            </div>
            <Link
              href={`/super-admin/courses/${course.id}/edit${campusId ? `?campusId=${campusId}` : ""}`}
            >
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-blue-100 py-2 font-medium text-blue-600 text-xs transition-colors hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20"
              >
                ✏️ Edit Price & Details
              </button>
            </Link>
          </div>
        ))}
        {courses.length === 0 ? (
          <div className="py-12 text-center text-gray-400 sm:col-span-2 lg:col-span-3">
            No courses yet
          </div>
        ) : null}
      </div>
    </div>
  );
}
