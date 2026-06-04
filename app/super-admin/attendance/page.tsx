export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminAttendancePage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAttendance = await prisma.attendance.findMany({
    where: {
      date: { gte: today },
      class: campusId ? { campusId } : undefined,
    },
    include: {
      enrollment: {
        include: {
          student: { include: { user: true } },
        },
      },
      class: { include: { course: true, lab: true } },
    },
    orderBy: { date: "desc" },
  });

  const presentCount = todayAttendance.filter(
    (attendance) => attendance.status === "PRESENT",
  ).length;
  const absentCount = todayAttendance.filter(
    (attendance) => attendance.status === "ABSENT",
  ).length;
  const total = todayAttendance.length;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const byClass: Record<string, typeof todayAttendance> = {};
  for (const attendance of todayAttendance) {
    const key = attendance.classId ?? "unknown";
    byClass[key] ??= [];
    byClass[key].push(attendance);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Today's attendance overview"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Marked",
            value: total,
            cardClass: "bg-gray-50 dark:bg-gray-800",
            valueClass: "text-gray-700 dark:text-white",
          },
          {
            label: "Present",
            value: presentCount,
            cardClass: "bg-green-50 dark:bg-green-900/20",
            valueClass: "text-green-700 dark:text-green-400",
          },
          {
            label: "Absent",
            value: absentCount,
            cardClass: "bg-red-50 dark:bg-red-900/20",
            valueClass: "text-red-700 dark:text-red-400",
          },
          {
            label: "Attendance Rate",
            value: `${rate}%`,
            cardClass: "bg-blue-50 dark:bg-blue-900/20",
            valueClass: "text-blue-700 dark:text-blue-400",
          },
        ].map(({ label, value, cardClass, valueClass }) => (
          <div key={label} className={`rounded-2xl p-4 ${cardClass}`}>
            <p className={`font-bold text-2xl ${valueClass}`}>{value}</p>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      {Object.keys(byClass).length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">📋</p>
          <p className="text-gray-400">No attendance marked today</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byClass).map(([classId, records]) => {
            const classInfo = records[0]?.class;
            const present = records.filter(
              (record) => record.status === "PRESENT",
            ).length;
            const absent = records.filter(
              (record) => record.status === "ABSENT",
            ).length;
            return (
              <div
                key={classId}
                className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold dark:text-white">
                      {classInfo?.course?.title ?? "Unknown Class"}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {classInfo?.lab?.name ?? "Online"} •{" "}
                      {classInfo?.timeSlot
                        ? TIME_SLOTS[
                            classInfo.timeSlot as keyof typeof TIME_SLOTS
                          ]
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
                      {present} present
                    </span>
                    {absent > 0 ? (
                      <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">
                        {absent} absent
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      title={`${record.enrollment.student.user.firstName} ${record.enrollment.student.user.lastName} — ${record.status}`}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                        record.status === "PRESENT"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : record.status === "ABSENT"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {record.enrollment.student.user.firstName[0]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
