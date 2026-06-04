export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function StudentAttendancePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!student) redirect("/sign-in");

  const enrollment = await prisma.enrollment.findFirst({
    where: { student: { userId: student.id }, status: "ACTIVE" },
    include: {
      class: { include: { course: true } },
      attendance: { orderBy: { date: "desc" } },
    },
  });

  const attendance = enrollment?.attendance ?? [];
  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendance.filter((a) => a.status === "LATE").length;
  const total = attendance.length;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const byMonth: Record<string, typeof attendance> = {};
  attendance.forEach((attendanceRecord) => {
    const key = new Date(attendanceRecord.date).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(attendanceRecord);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Attendance</h1>
        <p className="mt-1 text-gray-500">
          {enrollment?.class?.course?.title ?? "Your attendance history"}
        </p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <div className="relative h-40 w-40 flex-shrink-0">
            <svg
              className="h-40 w-40 -rotate-90"
              viewBox="0 0 160 160"
              role="img"
              aria-label="Attendance rate chart"
            >
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="16"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke={
                  rate >= 80 ? "#22c55e" : rate >= 60 ? "#f59e0b" : "#ef4444"
                }
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - rate / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-900">{rate}%</span>
              <span className="text-sm text-gray-400">Rate</span>
            </div>
          </div>
          <div className="grid w-full flex-1 grid-cols-3 gap-4">
            {[
              {
                label: "Present",
                count: presentCount,
                color: "bg-green-50 text-green-700",
              },
              {
                label: "Absent",
                count: absentCount,
                color: "bg-red-50 text-red-700",
              },
              {
                label: "Late",
                count: lateCount,
                color: "bg-amber-50 text-amber-700",
              },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                className={`${color} rounded-2xl p-4 text-center`}
              >
                <p className="text-3xl font-black">{count}</p>
                <p className="mt-1 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {Object.keys(byMonth).length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="mb-3 text-4xl">📋</p>
          <p className="text-gray-400">No attendance recorded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byMonth).map(([month, records]) => {
            const monthPresent = records.filter(
              (record) => record.status === "PRESENT",
            ).length;
            const monthTotal = records.length;
            const monthRate =
              monthTotal > 0
                ? Math.round((monthPresent / monthTotal) * 100)
                : 0;
            return (
              <div
                key={month}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{month}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      monthRate >= 80
                        ? "bg-green-50 text-green-700"
                        : monthRate >= 60
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {monthRate}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {records.map((attendanceRecord) => (
                    <div
                      key={attendanceRecord.id}
                      title={new Date(attendanceRecord.date).toLocaleDateString(
                        "en-GB",
                        { weekday: "short", day: "2-digit", month: "short" },
                      )}
                      className={`flex h-10 w-10 flex-col items-center justify-center rounded-xl text-xs font-bold ${
                        attendanceRecord.status === "PRESENT"
                          ? "bg-green-100 text-green-700"
                          : attendanceRecord.status === "ABSENT"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <span>{new Date(attendanceRecord.date).getDate()}</span>
                      <span className="text-xs leading-none opacity-70">
                        {attendanceRecord.status === "PRESENT"
                          ? "✓"
                          : attendanceRecord.status === "ABSENT"
                            ? "✗"
                            : "L"}
                      </span>
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
