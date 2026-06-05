export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { resolveStudentUser } from "@/lib/resolve-student-user";

export default async function StudentDashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress?.toLowerCase();

  const student = await resolveStudentUser(userId, email, {
      campus: true,
      studentProfile: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              class: {
                include: {
                  course: true,
                  lab: true,
                  teacher: { include: { user: true } },
                  materials: { orderBy: { createdAt: "desc" }, take: 3 },
                },
              },
              attendance: { orderBy: { date: "desc" }, take: 30 },
              payments: { orderBy: { createdAt: "desc" }, take: 1 },
              paymentRemaining: true,
            },
            take: 1,
          },
          certificates: { orderBy: { issuedAt: "desc" }, take: 1 },
        },
      },
  });

  if (!student?.studentProfile) {
    redirect("/unauthorized?reason=no-profile");
  }

  const enrollment = student.studentProfile.enrollments[0];
  const classRecord = enrollment?.class;
  const attendance = enrollment?.attendance ?? [];
  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const totalCount = attendance.length;
  const attendanceRate =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const remaining = enrollment?.paymentRemaining;
  const hasRemaining = Boolean(remaining && remaining.remainingAmount > 0);
  const daysUntilDue = remaining?.dueDate
    ? Math.ceil(
        (new Date(remaining.dueDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const certificate = student.studentProfile.certificates[0];

  const today = new Date();
  const dayOfWeek = today.getDay();
  const isMWF = [1, 3, 5].includes(dayOfWeek);
  const isTTS = [2, 4, 6].includes(dayOfWeek);
  const hasClassToday =
    classRecord &&
    ((classRecord.days === "MWF" && isMWF) ||
      (classRecord.days === "TTS" && isTTS) ||
      classRecord.classType === "ONLINE");

  const notifications = await prisma.studentNotification.findMany({
    where: { studentId: student.id, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const totalDays =
    classRecord?.startDate && classRecord?.endDate
      ? Math.ceil(
          (classRecord.endDate.getTime() - classRecord.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
  const elapsedDays = classRecord?.startDate
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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 text-white sm:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-32 translate-x-32 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-24 translate-y-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="mb-1 text-sm font-medium text-blue-100">Welcome back</p>
          <h1 className="mb-1 text-2xl font-black sm:text-3xl">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-sm text-blue-100">
            {student.studentProfile.studentCode} • {student.campus?.name}
          </p>
          {hasClassToday && classRecord && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">You have class today!</p>
                <p className="text-xs text-blue-100">
                  {classRecord.lab?.name ?? "Online"} •{" "}
                  {TIME_SLOTS[classRecord.timeSlot as keyof typeof TIME_SLOTS]}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Link href="/student/attendance">
          <div
            className={`rounded-2xl p-5 transition-all hover:scale-[1.02] ${
              attendanceRate >= 80
                ? "bg-green-50"
                : attendanceRate >= 60
                  ? "bg-amber-50"
                  : "bg-red-50"
            }`}
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                attendanceRate >= 80
                  ? "bg-green-100"
                  : attendanceRate >= 60
                    ? "bg-amber-100"
                    : "bg-red-100"
              }`}
            >
              <ClipboardCheck
                size={20}
                className={
                  attendanceRate >= 80
                    ? "text-green-600"
                    : attendanceRate >= 60
                      ? "text-amber-600"
                      : "text-red-600"
                }
              />
            </div>
            <p
              className={`text-3xl font-black ${
                attendanceRate >= 80
                  ? "text-green-700"
                  : attendanceRate >= 60
                    ? "text-amber-700"
                    : "text-red-700"
              }`}
            >
              {attendanceRate}%
            </p>
            <p className="mt-1 text-sm text-gray-500">Attendance</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {presentCount} of {totalCount} sessions
            </p>
          </div>
        </Link>

        <Link href="/student/payments">
          <div
            className={`rounded-2xl p-5 transition-all hover:scale-[1.02] ${hasRemaining ? "bg-amber-50" : "bg-green-50"}`}
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${hasRemaining ? "bg-amber-100" : "bg-green-100"}`}
            >
              <CreditCard
                size={20}
                className={hasRemaining ? "text-amber-600" : "text-green-600"}
              />
            </div>
            {hasRemaining && remaining ? (
              <>
                <p className="text-3xl font-black text-amber-700">
                  ETB {remaining.remainingAmount.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-gray-500">Remaining</p>
                <p className="mt-0.5 text-xs text-amber-600">
                  {daysUntilDue !== null
                    ? daysUntilDue < 0
                      ? `${Math.abs(daysUntilDue)} days overdue`
                      : `Due in ${daysUntilDue} days`
                    : "Check due date"}
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-green-700">Paid ✓</p>
                <p className="mt-1 text-sm text-gray-500">Payment</p>
                <p className="mt-0.5 text-xs text-green-600">All clear</p>
              </>
            )}
          </div>
        </Link>

        <Link href="/student/certificate">
          <div className="rounded-2xl bg-purple-50 p-5 transition-all hover:scale-[1.02]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Award size={20} className="text-purple-600" />
            </div>
            {certificate ? (
              <>
                <p className="text-3xl font-black text-purple-700">
                  {certificate.isDelivered ? "🎓" : "⏳"}
                </p>
                <p className="mt-1 text-sm text-gray-500">Certificate</p>
                <p className="mt-0.5 text-xs text-purple-600">
                  {certificate.isDelivered ? "Delivered" : "Ready to collect"}
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-gray-400">—</p>
                <p className="mt-1 text-sm text-gray-500">Certificate</p>
                <p className="mt-0.5 text-xs text-gray-400">Not issued yet</p>
              </>
            )}
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {classRecord ? (
          <Link href="/student/class">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    My Class
                  </p>
                  <h2 className="text-xl font-bold text-gray-900">
                    {classRecord.course.title}
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                  <BookOpen size={22} className="text-white" />
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  {TIME_SLOTS[classRecord.timeSlot as keyof typeof TIME_SLOTS]}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  {CLASS_DAYS[classRecord.days as keyof typeof CLASS_DAYS]}
                </div>
              </div>
              {progressPercent > 0 && (
                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-gray-400">
                    <span>Course Progress</span>
                    <span className="font-semibold">{progressPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Day {elapsedDays} of {totalDays}
                  </p>
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-center">
            <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">Not enrolled in any class yet</p>
          </div>
        )}

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Notifications</h2>
            <Link href="/student/notifications">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View all →
              </button>
            </Link>
          </div>
          {notifications.length === 0 ? (
            <div className="py-6 text-center">
              <Bell size={28} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex gap-3 rounded-2xl bg-blue-50 p-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <Bell size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(notification.createdAt).toLocaleDateString(
                        "en-GB",
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
