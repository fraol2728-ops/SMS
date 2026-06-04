export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminHistoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};

  const classRecord = await prisma.class.findFirst({
    where: { id, status: "ENDED" },
    include: {
      course: true,
      lab: true,
      teacher: { include: { user: true } },
      enrollments: {
        include: {
          student: { include: { user: true } },
          attendance: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!classRecord) notFound();

  const completed = classRecord.enrollments.filter(
    (e) => e.status === "COMPLETED",
  );
  const dropped = classRecord.enrollments.filter((e) => e.status === "DROPPED");
  const query = campusId ? `?campusId=${campusId}` : "";

  return (
    <div className="space-y-6">
      <Link href={`/super-admin/history${query}`}>
        <button
          className="text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back
        </button>
      </Link>

      <PageHeader
        title={classRecord.course.title}
        description="Ended class — history record"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Students", value: classRecord.enrollments.length },
          { label: "Completed", value: completed.length },
          { label: "Dropped", value: dropped.length },
          {
            label: "Duration",
            value: `${classRecord.course.durationWeeks} weeks`,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="mb-1 text-gray-400 text-xs">{label}</p>
            <p className="font-bold text-2xl dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 font-semibold dark:text-white">Students</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b dark:border-gray-700">
              <tr>
                {["#", "Student", "Code", "Attendance", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-medium text-gray-400 text-xs"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classRecord.enrollments.map((e, i) => {
                const user = e.student.user;
                const present = e.attendance.filter(
                  (a) => a.status === "PRESENT",
                ).length;
                const total = e.attendance.length;
                const rate =
                  total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <tr
                    key={e.id}
                    className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium dark:text-white">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-700">
                        {e.student.studentCode}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className="h-1.5 rounded-full bg-green-500"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-gray-500 text-xs">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          e.status === "COMPLETED"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
