export const dynamic = "force-dynamic";

import { BookOpen, Clock, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function CoursesPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const courses = await prisma.course.findMany({
    where: campusId ? { campusId } : {},
    include: {
      _count: {
        select: { classes: { where: { isActive: true, status: "STARTED" } } },
      },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        action={{ label: "Add Course", href: "/admin/courses/new" }}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="group rounded-3xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md transition-transform group-hover:scale-105">
              <BookOpen size={22} className="text-white" />
            </div>
            <h3 className="mb-1 font-bold text-gray-900 text-lg leading-tight dark:text-white">
              {course.title}
            </h3>
            <span
              className={`mb-4 inline-block rounded-full px-2.5 py-1 font-medium text-xs ${
                course.isActive
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700"
              }`}
            >
              {course.isActive ? "Active" : "Inactive"}
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Clock size={13} />
                  Duration
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {course.durationWeeks} weeks
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Users size={13} />
                  Active Classes
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {course._count.classes}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm dark:border-gray-700">
                <span className="text-gray-500">Price</span>
                <span className="font-black text-base text-blue-600 dark:text-blue-400">
                  ETB {course.fee?.toLocaleString() ?? "—"}
                </span>
              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="py-16 text-center text-gray-400 sm:col-span-2 lg:col-span-3 rounded-3xl border bg-white dark:border-gray-700 dark:bg-gray-900">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No courses yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
