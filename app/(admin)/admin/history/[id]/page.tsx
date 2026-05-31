export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const classRecord = await prisma.class.findFirst({
    where: { id, status: "ENDED" },
    include: {
      course: true,
      lab: true,
      teacher: { include: { user: true } },
      enrollments: {
        include: {
          student: { include: { user: true } },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
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
  return (
    <div className="space-y-6">
      <PageHeader
        title={classRecord.course.title}
        description="Ended class — history record"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: classRecord.enrollments.length },
          { label: "Completed", value: completed.length },
          { label: "Dropped", value: dropped.length },
          {
            label: "Duration",
            value: `${classRecord.course.durationWeeks} weeks`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Students</h2>
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              {["#", "Student", "Code", "Attendance", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left py-2 px-3 text-xs text-muted-foreground font-medium"
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
              const rate = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <tr key={e.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {e.student.studentCode}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-xs">{rate}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${e.status === "COMPLETED" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
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
  );
}
