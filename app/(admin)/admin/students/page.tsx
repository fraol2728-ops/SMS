export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma, withRetry } from "@/lib/prisma";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const params = (await searchParams) ?? {};
  const PAGE_SIZE = 20;
  const currentPage = Math.max(1, Number(params.page ?? 1) || 1);
  const q = params.q?.trim();

  const where = {
    user: {
      role: "STUDENT" as const,
      ...(campusId ? { campusId } : {}),
    },
    ...(q
      ? {
          OR: [
            { studentCode: { contains: q, mode: "insensitive" as const } },
            {
              user: {
                firstName: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              user: { lastName: { contains: q, mode: "insensitive" as const } },
            },
            { user: { phone: { contains: q } } },
          ],
        }
      : {}),
  };

  try {
    const [students, totalCount] = await withRetry(() =>
      Promise.all([
        prisma.studentProfile.findMany({
          where,
          include: {
            user: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                class: { include: { course: true } },
                payments: { take: 1 },
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { registrationDate: "desc" },
          skip: (currentPage - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.studentProfile.count({ where }),
      ]),
    );

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Students"
          description={`${totalCount} total students`}
          action={{ label: "Add Student", href: "/admin/students/new" }}
        />

        <form method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, phone, or student code..."
            className="h-11 w-full rounded-2xl border bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </form>

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {students.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="mb-3 text-4xl">👥</p>
              <p className="font-semibold">No students found</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700/50">
              {students.map((student) => {
                const enrollment = student.enrollments[0];
                const course = enrollment?.class?.course?.title;
                return (
                  <Link
                    key={student.id}
                    href={`/admin/students/${student.userId}`}
                    className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                      {student.user.firstName[0]}
                      {student.user.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white">
                        {student.user.firstName} {student.user.lastName}
                      </p>
                      <p className="truncate text-gray-400 text-sm">
                        {course ?? "No class assigned"}
                      </p>
                    </div>
                    <p className="hidden flex-shrink-0 text-gray-500 text-sm sm:block">
                      {student.user.phone ?? "—"}
                    </p>
                    <span className="flex-shrink-0 text-gray-300 transition-colors group-hover:text-blue-500">
                      ›
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
          {totalPages > 1 && (
            <div className="border-t px-6 py-4 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={PAGE_SIZE}
              />
            </div>
          )}
        </div>
      </div>
    );
  } catch (error: any) {
    const msg = (error?.message ?? String(error)).toLowerCase();
    const isDbError =
      msg.includes("can't reach database") ||
      msg.includes('etimedout') ||
      msg.includes('connection') ||
      msg.includes('p1001') ||
      msg.includes('p1002');

    if (isDbError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center">
            <span className="text-3xl">🔌</span>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Database Waking Up
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
              The database server is starting up. This happens after periods of inactivity. Please wait a moment and refresh the page.
            </p>
          </div>
          <Link
            href="/admin/students"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition-colors"
          >
            Try Again
          </Link>
        </div>
      );
    }

    throw error;
  }
}
