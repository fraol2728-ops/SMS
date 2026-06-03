export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth-check";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherDashboard() {
  await requireTeacher();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            where: { isActive: true, status: "STARTED" },
            include: {
              course: true,
              lab: true,
              _count: {
                select: { enrollments: { where: { status: "ACTIVE" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const classes = teacher.teacherProfile.classes;
  const totalStudents = classes.reduce(
    (sum: number, c: any) => sum + c._count.enrollments,
    0,
  );

  const today = new Date();
  const dayOfWeek = today.getDay();
  const isMWF = [1, 3, 5].includes(dayOfWeek);
  const isTTS = [2, 4, 6].includes(dayOfWeek);

  const todayClasses = classes.filter((c: any) => {
    if (c.days === "MWF" && isMWF) return true;
    if (c.days === "TTS" && isTTS) return true;
    return false;
  });

  const thisWeekStart = new Date();
  thisWeekStart.setDate(today.getDate() - today.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const attendanceStats = await prisma.attendance.groupBy({
    by: ["status"],
    where: {
      class: {
        teacherId: teacher.teacherProfile.id,
      },
      date: { gte: thisWeekStart },
    },
    _count: true,
  });

  const presentCount =
    attendanceStats.find((a: any) => a.status === "PRESENT")?._count ?? 0;
  const absentCount =
    attendanceStats.find((a: any) => a.status === "ABSENT")?._count ?? 0;
  const lateCount =
    attendanceStats.find((a: any) => a.status === "LATE")?._count ?? 0;
  const totalMarked = presentCount + absentCount + lateCount;
  const attendanceRate =
    totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "My Classes",
            value: classes.length,
            icon: BookOpen,
            bg: "bg-blue-50",
            text: "text-blue-700",
          },
          {
            label: "Total Students",
            value: totalStudents,
            icon: Users,
            bg: "bg-green-50",
            text: "text-green-700",
          },
          {
            label: "Today's Classes",
            value: todayClasses.length,
            icon: Calendar,
            bg: "bg-purple-50",
            text: "text-purple-700",
          },
          {
            label: "Attendance Rate",
            value: `${attendanceRate}%`,
            icon: TrendingUp,
            bg: "bg-amber-50",
            text: "text-amber-700",
          },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {label}
              </p>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}
              >
                <Icon size={18} className={text} />
              </div>
            </div>
            <p className="font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Today's Classes
            </h2>
            <span className="text-gray-400 text-xs">
              {today.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>

          {todayClasses.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-gray-400 text-sm">
                No classes scheduled today
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((c: any) => (
                <Link key={c.id} href={`/teacher/classes/${c.id}`}>
                  <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                      <BookOpen size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {c.course.title}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {c.lab?.name ?? "Online"} •{" "}
                        {TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {c._count.enrollments}
                      </p>
                      <p className="text-gray-400 text-xs">students</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">
            This Week's Attendance
          </h2>
          {totalMarked === 0 ? (
            <div className="py-8 text-center">
              <ClipboardCheck
                size={32}
                className="mx-auto mb-2 text-gray-300"
              />
              <p className="text-gray-400 text-sm">
                No attendance marked this week
              </p>
              <Link href="/teacher/attendance">
                <button
                  type="button"
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >
                  Mark attendance →
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  label: "Present",
                  count: presentCount,
                  color: "bg-green-500",
                  text: "text-green-700",
                },
                {
                  label: "Absent",
                  count: absentCount,
                  color: "bg-red-500",
                  text: "text-red-700",
                },
                {
                  label: "Late",
                  count: lateCount,
                  color: "bg-amber-500",
                  text: "text-amber-700",
                },
              ].map(({ label, count, color, text }) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                    <span className={`font-semibold ${text}`}>{count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{
                        width:
                          totalMarked > 0
                            ? `${(count / totalMarked) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="border-t pt-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Overall attendance rate:
                  <span className="ml-1 font-bold text-gray-900 dark:text-white">
                    {attendanceRate}%
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            All My Classes
          </h2>
          <Link href="/teacher/classes">
            <button
              type="button"
              className="text-blue-600 text-sm hover:underline"
            >
              View all →
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((c: any) => (
            <Link key={c.id} href={`/teacher/classes/${c.id}`}>
              <div className="rounded-xl border p-4 transition-all hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <BookOpen size={18} className="text-blue-600" />
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600 text-xs dark:bg-gray-800 dark:text-gray-300">
                    {c.lab?.name ?? "Online"}
                  </span>
                </div>
                <p className="mb-1 font-semibold text-gray-900 dark:text-white">
                  {c.course.title}
                </p>
                <p className="mb-3 text-gray-500 dark:text-gray-400 text-xs">
                  {TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS]} •{" "}
                  {CLASS_DAYS[c.days as keyof typeof CLASS_DAYS]}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 text-sm dark:text-gray-300">
                    {c._count.enrollments} / {c.capacity} students
                  </span>
                  <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(100, c.capacity ? (c._count.enrollments / c.capacity) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
