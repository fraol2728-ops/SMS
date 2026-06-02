export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const students = await prisma.studentProfile.findMany({
    where: campusId ? { user: { campusId } } : {},
    include: {
      user: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { include: { course: true, lab: true } } },
        take: 1,
      },
    },
    orderBy: { registrationDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        action={{
          label: "Add Student",
          href: `/super-admin/students/new?campusId=${campusId ?? ""}`,
        }}
      />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="divide-y divide-gray-200 dark:divide-gray-700 md:hidden">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/admin/students/${student.userId}?campusId=${campusId ?? ""}`}
            >
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-sm dark:bg-blue-900/30">
                    {student.user.firstName[0]}
                    {student.user.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">
                      {student.user.firstName} {student.user.lastName}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {student.enrollments[0]?.class?.course?.title ??
                        "No class"}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">›</span>
              </div>
            </Link>
          ))}
        </div>

        <table className="hidden w-full text-sm md:table">
          <thead className="border-gray-200 border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              {["Student", "Code", "Phone", "Course", "Enrolled"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left font-medium text-gray-400 text-xs"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-gray-200 border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs dark:bg-blue-900/30">
                      {student.user.firstName[0]}
                      {student.user.lastName[0]}
                    </div>
                    <Link
                      href={`/admin/students/${student.userId}?campusId=${campusId ?? ""}`}
                    >
                      <p className="font-medium hover:text-blue-600 dark:text-white">
                        {student.user.firstName} {student.user.lastName}
                      </p>
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">
                    {student.studentCode}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {student.user.phone ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {student.enrollments[0]?.class?.course?.title ? (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
                      {student.enrollments[0].class.course.title}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(student.user.createdAt).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No students yet</div>
        ) : null}
      </div>
    </div>
  );
}
