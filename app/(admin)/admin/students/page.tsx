import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import {
  StudentsTable,
  type StudentTableRow,
} from "@/components/admin/students/StudentsTable";
import { Pagination } from "@/components/shared/Pagination";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  const searchQuery = params.q?.trim();

  const where = {
    user: {
      role: "STUDENT" as const,
      ...(campusId ? { campusId } : {}),
    },
    ...(searchQuery
      ? {
          OR: [
            {
              studentCode: {
                contains: searchQuery,
                mode: "insensitive" as const,
              },
            },
            {
              user: {
                firstName: {
                  contains: searchQuery,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              user: {
                lastName: {
                  contains: searchQuery,
                  mode: "insensitive" as const,
                },
              },
            },
            { user: { phone: { contains: searchQuery } } },
          ],
        }
      : {}),
  };

  const [students, totalCount] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      include: {
        user: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: {
              include: { course: true, lab: { select: { name: true } } },
            },
            payments: { orderBy: { createdAt: "desc" }, take: 1 },
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
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const rows: StudentTableRow[] = students.map((student) => {
    const activeEnrollment = student.enrollments[0];
    const latestPayment = activeEnrollment?.payments[0];
    const classRecord = activeEnrollment?.class;

    return {
      id: student.userId,
      studentCode: student.studentCode,
      fullName: `${student.user.firstName} ${student.user.lastName}`,
      phone: student.user.phone ?? "-",
      lab: classRecord?.lab?.name ?? "-",
      course: classRecord?.course.title ?? "-",
      time: classRecord
        ? TIME_SLOTS[classRecord.timeSlot as keyof typeof TIME_SLOTS]
        : "-",
      days: classRecord
        ? CLASS_DAYS[classRecord.days as keyof typeof CLASS_DAYS]
        : "-",
      paymentStatus: latestPayment?.status ?? "PENDING",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${totalCount} total students`}
        action={{ label: "Add student", href: "/admin/students/new" }}
      />
      <div className="space-y-2 md:hidden">
        {students.map((student) => {
          const activeEnrollment = student.enrollments[0];
          return (
            <Link key={student.id} href={`/admin/students/${student.userId}`}>
              <div className="flex items-center justify-between rounded-xl border bg-white p-4 transition-all hover:border-blue-300 active:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:active:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-sm dark:bg-blue-950 dark:text-blue-300">
                    {student.user.firstName[0]}
                    {student.user.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {student.user.firstName} {student.user.lastName}
                    </p>
                    <p className="text-gray-400 text-xs dark:text-gray-500">
                      {student.studentCode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 text-xs dark:bg-blue-950 dark:text-blue-300">
                    {activeEnrollment?.class?.course?.title ?? "No class"}
                  </span>
                  <p className="mt-1 text-gray-400 text-xs dark:text-gray-500">
                    ›
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <StudentsTable className="hidden md:block" students={rows} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={PAGE_SIZE}
      />
    </div>
  );
}
