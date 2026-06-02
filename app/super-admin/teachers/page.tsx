export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminTeachersPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { campusId } = (await searchParams) ?? {};

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", ...(campusId ? { campusId } : {}) },
    include: {
      teacherProfile: {
        include: {
          _count: { select: { classes: { where: { isActive: true } } } },
        },
      },
    },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        action={{
          label: "Add Teacher",
          href: `/admin/teachers/new?campusId=${campusId ?? ""}`,
        }}
      />
      <div className="space-y-2 md:hidden">
        {teachers.map((teacher) => (
          <Link
            key={teacher.id}
            href={`/admin/teachers/${teacher.teacherProfile?.id ?? ""}?campusId=${campusId ?? ""}`}
          >
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-sm dark:bg-green-900/30">
                {teacher.firstName[0]}
                {teacher.lastName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium dark:text-white">
                  {teacher.firstName} {teacher.lastName}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {(teacher.teacherProfile?.specialties ?? [])
                    .slice(0, 2)
                    .map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full bg-green-50 px-1.5 py-0.5 text-green-700 text-xs"
                      >
                        {specialty}
                      </span>
                    ))}
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </div>
          </Link>
        ))}
        {teachers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900">
            No teachers yet
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 md:block">
        <table className="w-full text-sm">
          <thead className="border-gray-200 border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              {["Teacher", "Code", "Specialties", "Classes", "Phone"].map(
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
            {teachers.map((teacher) => (
              <tr
                key={teacher.id}
                className="border-gray-200 border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-xs">
                      {teacher.firstName[0]}
                      {teacher.lastName[0]}
                    </div>
                    <Link
                      href={`/admin/teachers/${teacher.teacherProfile?.id ?? ""}?campusId=${campusId ?? ""}`}
                    >
                      <p className="font-medium hover:text-blue-600 dark:text-white">
                        {teacher.firstName} {teacher.lastName}
                      </p>
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">
                    {teacher.teacherProfile?.teacherCode ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(teacher.teacherProfile?.specialties ?? [])
                      .slice(0, 3)
                      .map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full bg-green-50 px-2 py-0.5 text-green-700 text-xs"
                        >
                          {specialty}
                        </span>
                      ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {teacher.teacherProfile?._count.classes ?? 0}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {teacher.phone ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {teachers.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No teachers yet</div>
        ) : null}
      </div>
    </div>
  );
}
