export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CreditCard,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTopPerformingTeacher } from "@/lib/actions/performance";
import { requireSuperAdmin } from "@/lib/auth-check";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma, withRetry } from "@/lib/prisma";

export default async function SuperAdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  await requireSuperAdmin();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const campus = campusId
    ? await prisma.campus.findUnique({ where: { id: campusId } })
    : await prisma.campus.findFirst({ orderBy: { createdAt: "asc" } });

  if (!campus) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-2xl">🏫</p>
        <p className="font-semibold dark:text-white">No campuses yet</p>
        <Link href="/super-admin/campuses/new">
          <button
            className="mt-4 rounded-xl bg-blue-600 px-6 py-2 text-sm text-white"
            type="button"
          >
            Add First Campus
          </button>
        </Link>
      </div>
    );
  }

  const effectiveCampusId = campus.id;
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  // Batch 1 — core counts
  const [totalStudents, totalTeachers, onRegistration, activeCourses] =
    await withRetry(() =>
      Promise.all([
        prisma.user.count({
          where: { role: "STUDENT", campusId: effectiveCampusId },
        }),
        prisma.user.count({
          where: { role: "TEACHER", campusId: effectiveCampusId },
        }),
        prisma.class.count({
          where: {
            campusId: effectiveCampusId,
            status: "REGISTRATION",
            isActive: true,
          },
        }),
        prisma.course.count({
          where: { campusId: effectiveCampusId, isActive: true },
        }),
      ]),
    );

  // Batch 2 — revenue, certificates, and lists
  const [
    monthlyPayments,
    monthlyPartialPayments,
    outstanding,
    pendingCertificates,
    todayAttendance,
    recentStudents,
    registrationClasses,
  ] = await withRetry(() =>
    Promise.all([
      prisma.payment.aggregate({
        where: {
          createdAt: { gte: monthStart },
          enrollment: {
            class: { campusId: effectiveCampusId },
          },
        },
        _sum: { amount: true },
      }),
      prisma.partialPayment.aggregate({
        where: {
          createdAt: { gte: monthStart },
          paymentRemaining: {
            enrollment: {
              class: { campusId: effectiveCampusId },
            },
          },
        },
        _sum: { amount: true },
      }),
      prisma.paymentRemaining.aggregate({
        where: {
          status: { not: "PAID" },
          enrollment: { class: { campusId: effectiveCampusId } },
        },
        _sum: { remainingAmount: true },
      }),
      prisma.certificate.count({
        where: {
          isDelivered: false,
          student: {
            user: { campusId: effectiveCampusId ?? undefined },
          },
        },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: todayStart },
          class: { campusId: effectiveCampusId },
        },
      }),
      prisma.studentProfile.findMany({
        where: { user: { campusId: effectiveCampusId } },
        include: {
          user: {
            select: { firstName: true, lastName: true, createdAt: true },
          },
          enrollments: {
            where: { status: "ACTIVE" },
            include: { class: { include: { course: true } } },
            take: 1,
          },
        },
        orderBy: { registrationDate: "desc" },
        take: 5,
      }),
      prisma.class.findMany({
        where: {
          campusId: effectiveCampusId,
          status: "REGISTRATION",
          isActive: true,
        },
        include: {
          course: true,
          lab: true,
          _count: {
            select: { enrollments: { where: { status: "ACTIVE" } } },
          },
        },
        orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
      }),
    ]),
  );

  const topTeacher = await getTopPerformingTeacher(effectiveCampusId);

  const kpis = [
    {
      label: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600",
      trend: "+12%",
    },
    {
      label: "Teachers",
      value: totalTeachers,
      icon: GraduationCap,
      color: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600",
      href: `/super-admin/teachers?campusId=${effectiveCampusId}`,
      trend: null,
    },
    {
      label: "On Registration",
      value: onRegistration,
      icon: Calendar,
      color: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600",
      href: `/super-admin/classes?campusId=${effectiveCampusId}&status=REGISTRATION`,
      trend: null,
    },
    {
      label: "Monthly Revenue",
      value: `ETB ${((monthlyPayments._sum.amount ?? 0) + (monthlyPartialPayments._sum.amount ?? 0)).toLocaleString()}`,
      icon: CreditCard,
      color: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600",
      trend: null,
    },
    {
      label: "Outstanding",
      value: `ETB ${(outstanding._sum.remainingAmount ?? 0).toLocaleString()}`,
      icon: AlertCircle,
      color: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600",
      href: `/super-admin/remaining?campusId=${effectiveCampusId}`,
      trend: null,
    },
    {
      label: "Pending Certificates",
      value: pendingCertificates,
      icon: Award,
      color: "bg-yellow-50 dark:bg-yellow-900/20",
      iconColor: "text-yellow-600",
      href: `/super-admin/certificates?campusId=${effectiveCampusId}`,
      trend: null,
    },
    {
      label: "Today's Attendance",
      value: todayAttendance,
      icon: TrendingUp,
      color: "bg-teal-50 dark:bg-teal-900/20",
      iconColor: "text-teal-600",
      href: `/super-admin/attendance?campusId=${effectiveCampusId}`,
      trend: null,
    },
    {
      label: "Active Courses",
      value: activeCourses,
      icon: BookOpen,
      color: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600",
      href: `/super-admin/courses?campusId=${effectiveCampusId}`,
      trend: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white dark:from-gray-800 dark:to-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-2xl">{campus.name} Campus</h1>
            <p className="mt-1 text-gray-400">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/super-admin/students/new?campusId=${effectiveCampusId}`}
            >
              <button
                className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700"
                type="button"
              >
                + Add Student
              </button>
            </Link>
            <Link href={`/super-admin/classes?campusId=${effectiveCampusId}`}>
              <button
                className="rounded-xl bg-white/10 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-white/20"
                type="button"
              >
                View Classes
              </button>
            </Link>
          </div>
        </div>
      </div>

      {pendingCertificates > 0 && (
        <Link href={`/super-admin/certificates?campusId=${effectiveCampusId}`}>
          <div className="flex cursor-pointer items-center justify-between rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-4 shadow-sm transition-opacity hover:opacity-90">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-xl">
                🎓
              </div>
              <div>
                <p className="font-medium text-white/80 text-xs">
                  Certificates Pending
                </p>
                <p className="font-bold text-white">
                  {pendingCertificates} certificate
                  {pendingCertificates !== 1 ? "s" : ""} to deliver
                </p>
              </div>
            </div>
            <span className="flex-shrink-0 text-white text-xl">→</span>
          </div>
        </Link>
      )}

      {registrationClasses.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
            Open for Registration ({registrationClasses.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {registrationClasses.map((c) => (
              <Link
                key={c.id}
                href={`/super-admin/classes/${c.id}?campusId=${effectiveCampusId}`}
              >
                <div className="group rounded-2xl border-2 border-blue-100 bg-white p-4 transition-all hover:border-blue-300 dark:border-blue-900/30 dark:bg-gray-900 dark:hover:border-blue-600">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                      <span className="font-black text-blue-600 text-sm">
                        {c._count.enrollments}
                      </span>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400">
                      OPEN
                    </span>
                  </div>
                  <p className="truncate font-bold text-gray-900 text-sm transition-colors group-hover:text-blue-600 dark:text-white">
                    {c.course.title}
                  </p>
                  <p className="mt-0.5 truncate text-gray-400 text-xs">
                    {c.lab?.name ?? "Online"} •{" "}
                    {TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS] ??
                      c.timeSlot}{" "}
                    • {CLASS_DAYS[c.days as keyof typeof CLASS_DAYS] ?? c.days}
                  </p>
                  <p className="mt-1 text-gray-300 text-xs dark:text-gray-500">
                    {c._count.enrollments}/{c.capacity} students
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {topTeacher && (
        <Link
          href={`/super-admin/teachers/${topTeacher.teacher.id}?campusId=${effectiveCampusId}`}
        >
          <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-700 p-5 text-white shadow-lg transition-opacity hover:opacity-95">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/20 font-black text-xl">
                  {topTeacher.teacher.user.profilePhoto ? (
                    <Image
                      src={topTeacher.teacher.user.profilePhoto}
                      alt=""
                      width={56}
                      height={56}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      {topTeacher.teacher.user.firstName[0]}
                      {topTeacher.teacher.user.lastName[0]}
                    </>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-100">
                    Top Performing Teacher
                  </p>
                  <p className="text-lg font-black">
                    {topTeacher.teacher.user.firstName}{" "}
                    {topTeacher.teacher.user.lastName}
                  </p>
                  <p className="text-sm text-purple-100">
                    {topTeacher.performance.grade}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black">
                  {topTeacher.performance.totalScore}
                </p>
                <p className="text-xs text-purple-100">score</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                [
                  "Rating",
                  topTeacher.performance.components.feedbackRating.score,
                  40,
                ],
                [
                  "Feedback",
                  topTeacher.performance.components.positiveFeedback.score,
                  30,
                ],
                [
                  "Attendance",
                  topTeacher.performance.components.attendance.score,
                  20,
                ],
                [
                  "Retention",
                  topTeacher.performance.components.retention.score,
                  10,
                ],
              ].map(([label, value, max]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-3">
                  <div className="mb-2 flex justify-between text-xs">
                    <span>{label}</span>
                    <b>
                      {value}/{max}
                    </b>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{
                        width: `${(Number(value) / Number(max)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(
          ({ label, value, icon: Icon, color, iconColor, href, trend }) => {
            const content = (
              <div
                key={label}
                className={`${color} rounded-2xl p-5 transition-all hover:scale-[1.02]`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                    <Icon size={20} className={iconColor} />
                  </div>
                  {trend ? (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-600 text-xs">
                      {trend}
                    </span>
                  ) : null}
                </div>
                <p className="font-bold text-2xl text-gray-900 dark:text-white sm:text-3xl">
                  {value}
                </p>
                <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                  {label}
                </p>
              </div>
            );

            return href ? (
              <Link key={label} href={href}>
                {content}
              </Link>
            ) : (
              <div key={label}>{content}</div>
            );
          },
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Recent Registrations
          </h2>
          <Link href={`/super-admin/students?campusId=${effectiveCampusId}`}>
            <button
              className="text-blue-600 text-sm hover:text-blue-800 dark:text-blue-400"
              type="button"
            >
              View all →
            </button>
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p>No students yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-sm dark:bg-blue-900/30 dark:text-blue-400">
                    {student.user.firstName[0]}
                    {student.user.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm dark:text-white">
                      {student.user.firstName} {student.user.lastName}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {student.enrollments[0]?.class?.course?.title ??
                        "No class"}
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-xs">
                  {new Date(student.user.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
