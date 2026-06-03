export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import {
  BookOpen,
  Building2,
  Calendar,
  Clock,
  GraduationCap,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};

  const classRecord = await prisma.class.findUnique({
    where: { id },
    include: {
      course: true,
      campus: true,
      lab: true,
      teacher: { include: { user: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: { include: { user: true } },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!classRecord) notFound();

  const timeLabel =
    classRecord.classType === "ONLINE"
      ? "Online"
      : TIME_SLOTS[classRecord.timeSlot as keyof typeof TIME_SLOTS];
  const daysLabel =
    classRecord.classType === "ONLINE"
      ? "Flexible"
      : CLASS_DAYS[classRecord.days as keyof typeof CLASS_DAYS];

  const today = new Date();
  const totalDays =
    classRecord.startDate && classRecord.endDate
      ? Math.ceil(
          (classRecord.endDate.getTime() - classRecord.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
  const elapsedDays = classRecord.startDate
    ? Math.max(
        0,
        Math.ceil(
          (today.getTime() - classRecord.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  const progressPercent =
    totalDays > 0
      ? Math.min(100, Math.round((elapsedDays / totalDays) * 100))
      : 0;

  const activeStudents = classRecord.enrollments.length;
  const spotsLeft = classRecord.capacity - activeStudents;

  return (
    <div className="space-y-6">
      <Link href={`/super-admin/classes?campusId=${campusId ?? ""}`}>
        <button
          className="flex items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back to Classes
        </button>
      </Link>

      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="font-bold text-2xl dark:text-white">
              {classRecord.course.title}
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {classRecord.campus.name} Campus
              {classRecord.lab ? ` • ${classRecord.lab.name}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`rounded-xl px-3 py-1.5 font-medium text-sm ${classRecord.status === "STARTED" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : classRecord.status === "REGISTRATION" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
            >
              {classRecord.status}
            </span>
            <span className="rounded-xl bg-gray-100 px-3 py-1.5 font-medium text-gray-600 text-sm dark:bg-gray-700 dark:text-gray-300">
              {classRecord.classType}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Lab",
            value: classRecord.lab?.name ?? "Online",
            icon: Building2,
          },
          { label: "Time", value: timeLabel, icon: Clock },
          { label: "Days", value: daysLabel, icon: Calendar },
          {
            label: "Students",
            value: `${activeStudents} / ${classRecord.capacity}`,
            icon: Users,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="mb-2 flex items-center gap-2 text-gray-400">
              <Icon size={14} />
              <p className="text-xs">{label}</p>
            </div>
            <p className="font-bold text-sm dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap size={16} className="text-gray-400" />
            <p className="font-medium text-sm dark:text-white">Teacher</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700 text-sm dark:bg-green-900/30">
              {classRecord.teacher.user.firstName[0]}
              {classRecord.teacher.user.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-sm dark:text-white">
                {classRecord.teacher.user.firstName}{" "}
                {classRecord.teacher.user.lastName}
              </p>
              <p className="text-gray-400 text-xs">
                {classRecord.teacher.user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-gray-400" />
            <p className="font-medium text-sm dark:text-white">Course</p>
          </div>
          <p className="font-semibold dark:text-white">
            {classRecord.course.title}
          </p>
          <p className="mt-1 text-gray-400 text-xs">
            {classRecord.course.durationWeeks} weeks • ETB{" "}
            {classRecord.course.fee?.toLocaleString()}
          </p>
        </div>
      </div>

      {classRecord.status === "STARTED" && totalDays > 0 ? (
        <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium dark:text-white">Course Progress</p>
            <p className="font-bold text-sm dark:text-white">
              {progressPercent}%
            </p>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-4 rounded-full transition-all duration-700 ${progressPercent >= 100 ? "bg-green-500" : progressPercent >= 60 ? "bg-blue-500" : progressPercent >= 30 ? "bg-amber-500" : "bg-blue-400"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-gray-400 text-xs">
            <span>Day {elapsedDays}</span>
            <span>{Math.max(0, totalDays - elapsedDays)} days remaining</span>
            <span>Day {totalDays}</span>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold dark:text-white">
            Enrolled Students ({activeStudents})
          </h2>
          <span
            className={`rounded-full px-2 py-1 text-xs ${spotsLeft === 0 ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}
          >
            {spotsLeft === 0 ? "Full" : `${spotsLeft} spots left`}
          </span>
        </div>

        {classRecord.enrollments.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p>No students enrolled yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {classRecord.enrollments.map((enrollment, index) => {
                const user = enrollment.student.user;
                return (
                  <Link
                    key={enrollment.id}
                    href={`/super-admin/students/${user.id}?campusId=${campusId ?? ""}`}
                  >
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                      <span className="w-5 text-gray-400 text-xs">
                        {index + 1}
                      </span>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs dark:bg-blue-900/30">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {enrollment.student.studentCode}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${enrollment.payments[0]?.status === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {enrollment.payments[0]?.status ?? "No payment"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-gray-700 border-b">
                  <tr>
                    {[
                      "#",
                      "Student",
                      "Code",
                      "Phone",
                      "Start Date",
                      "Payment",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-3 py-3 text-left font-medium text-gray-400 text-xs"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classRecord.enrollments.map((enrollment, index) => {
                    const user = enrollment.student.user;
                    return (
                      <tr
                        key={enrollment.id}
                        className="border-gray-700 border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-3 py-3 text-gray-400 text-xs">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs dark:bg-blue-900/30">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </div>
                            <p className="font-medium text-sm dark:text-white">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-700">
                            {enrollment.student.studentCode}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs dark:text-gray-400">
                          {user.phone ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs dark:text-gray-400">
                          {new Date(enrollment.startDate).toLocaleDateString(
                            "en-GB",
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${enrollment.payments[0]?.status === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                          >
                            {enrollment.payments[0]?.status ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/super-admin/students/${user.id}?campusId=${campusId ?? ""}`}
                          >
                            <button
                              className="font-medium text-blue-600 text-xs hover:text-blue-800"
                              type="button"
                            >
                              View
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
