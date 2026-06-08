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
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
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

  const [
    totalStudents,
    totalTeachers,
    onRegistration,
    activeCourses,
    monthlyPayments,
    monthlyPartialPayments,
    outstanding,
    certificatesCount,
    todayAttendance,
    recentStudents,
  ] = await Promise.all([
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
    prisma.payment.aggregate({
      where: {
        paidAt: { gte: monthStart },
        user: { campusId: effectiveCampusId },
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
        course: { campusId: effectiveCampusId },
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
        user: { select: { firstName: true, lastName: true, createdAt: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { class: { include: { course: true } } },
          take: 1,
        },
      },
      orderBy: { registrationDate: "desc" },
      take: 5,
    }),
  ]);

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
      value: certificatesCount,
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
