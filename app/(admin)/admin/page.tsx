import { auth } from "@clerk/nextjs/server";
import { BookOpen, CreditCard, GraduationCap, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ActivityTableCard } from "@/components/admin/dashboard/ActivityTableCard";
import { DashboardHero } from "@/components/admin/dashboard/DashboardHero";
import { PaymentAlerts } from "@/components/admin/dashboard/PaymentAlerts";
import { KpiCard } from "@/components/admin/shared/KpiCard";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { TrendChart } from "@/components/admin/shared/TrendChart";
import { getTopPerformingTeacher } from "@/lib/actions/performance";
import { getAdminSettings } from "@/lib/actions/settings";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { buildTrendSeries } from "@/lib/dashboard";
import { prisma, withRetry } from "@/lib/prisma";

type RecentEnrollment = {
  id: string;
  startDate: Date;
  status: string;
  student: { user: { firstName: string; lastName: string } };
  course: { title: string };
};

type RecentPayment = {
  id: string;
  amount: number;
  method: string | null;
  status: string;
  createdAt: Date;
  user: { firstName: string; lastName: string };
  enrollment: { course: { title: string } };
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set in production. Please set it to connect to the database.",
      );
    }
    const { userId } = await auth();
    await requireAdmin();
    const campusId = await getCurrentUserCampusId();
    const adminUser = userId
      ? await withRetry(() =>
          prisma.user.findUnique({
            where: { clerkId: userId },
            select: {
              firstName: true,
              lastName: true,
              campus: { select: { name: true } },
            },
          }),
        )
      : null;
    const dateLabel = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const campusCourseWhere = campusId ? { course: { campusId } } : {};
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const chartStart = new Date(now);
    chartStart.setDate(now.getDate() - 29);
    chartStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // Batch 1 — core counts and aggregates
    const [
      totalStudents,
      activeEnrollments,
      monthlyPayments,
      monthlyPartialPayments,
      totalRemaining,
    ] = await withRetry(() =>
      Promise.all([
        prisma.user.count({
          where: { role: "STUDENT", ...(campusId ? { campusId } : {}) },
        }),
        prisma.enrollment.count({
          where: { status: "ACTIVE", ...campusCourseWhere },
        }),
        prisma.payment.aggregate({
          where: {
            createdAt: { gte: monthStart },
            enrollment: {
              class: campusId ? { campusId } : undefined,
            },
          },
          _sum: { amount: true },
        }),
        prisma.partialPayment.aggregate({
          where: {
            createdAt: { gte: monthStart },
            paymentRemaining: {
              enrollment: {
                class: campusId ? { campusId } : undefined,
              },
            },
          },
          _sum: { amount: true },
        }),
        prisma.paymentRemaining.aggregate({
          where: {
            status: { not: "PAID" },
            enrollment: { class: campusId ? { campusId } : undefined },
          },
          _sum: { remainingAmount: true },
        }),
      ]),
    );

    // Batch 2 — payment history and student data
    const [
      payments,
      newStudents,
      weeklyEnrollments,
      recentEnrollments,
      recentPayments,
      overduePayments,
      dueSoonPayments,
      nextEvent,
      pendingCertificates,
      registrationClasses,
    ] = await withRetry(() =>
      Promise.all([
        prisma.payment.findMany({
          where: {
            paidAt: { gte: chartStart },
            user: campusId ? { campusId } : undefined,
          },
          select: { amount: true, paidAt: true },
        }),
        prisma.user.findMany({
          where: {
            role: "STUDENT",
            createdAt: { gte: chartStart },
            ...(campusId ? { campusId } : {}),
          },
          select: { createdAt: true },
        }),
        prisma.enrollment.findMany({
          where: {
            createdAt: { gte: weekStart },
            ...(campusId ? { class: { campusId } } : {}),
          },
          orderBy: { createdAt: "desc" },
          include: { student: { include: { user: true } }, course: true },
          take: 12,
        }),
        prisma.enrollment.findMany({
          where: campusId ? { course: { campusId } } : undefined,
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { student: { include: { user: true } }, course: true },
        }),
        prisma.payment.findMany({
          where: campusId
            ? { enrollment: { course: { campusId } } }
            : undefined,
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { user: true, enrollment: { include: { course: true } } },
        }),
        prisma.paymentRemaining.count({
          where: {
            status: { not: "PAID" },
            dueDate: { lt: now },
            enrollment: {
              status: "ACTIVE",
              class: campusId ? { campusId } : undefined,
            },
          },
        }),
        prisma.paymentRemaining.count({
          where: {
            status: { not: "PAID" },
            dueDate: { gte: now, lte: sevenDaysFromNow },
            enrollment: {
              status: "ACTIVE",
              class: campusId ? { campusId } : undefined,
            },
          },
        }),
        prisma.event.findFirst({
          where: {
            campusId: campusId ?? undefined,
            isActive: true,
            date: { gte: new Date() },
          },
          orderBy: { date: "asc" },
        }),
        prisma.certificate.count({
          where: {
            isDelivered: false,
            student: {
              user: { campusId: campusId ?? undefined },
            },
          },
        }),
        prisma.class.findMany({
          where: {
            campusId: campusId ?? undefined,
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

    const revenueSeries = buildTrendSeries(
      payments,
      30,
      (item) => item.paidAt ?? new Date(0),
      (item) => item.amount,
    );
    const registrationSeries = buildTrendSeries(
      newStudents,
      30,
      (item) => item.createdAt,
      () => 1,
    );
    const weeklyEnrollmentSeries = buildTrendSeries(
      weeklyEnrollments,
      7,
      (item) => item.createdAt,
      () => 1,
    );
    const totalMonthlyRevenue =
      (monthlyPayments._sum.amount ?? 0) +
      (monthlyPartialPayments._sum.amount ?? 0);
    const outstandingRemaining = totalRemaining._sum.remainingAmount ?? 0;

    const settings = await getAdminSettings();
    const attendanceRate = 0;

    const kpiCards = [
      {
        show: settings?.showTotalStudents ?? true,
        title: "Total Students",
        value: totalStudents,
        icon: Users,
        color: "blue" as const,
        href: "/admin/students",
        hint: "All registered students",
      },
      {
        show: settings?.showActiveClasses ?? true,
        title: "Active Classes",
        value: activeEnrollments,
        icon: BookOpen,
        color: "green" as const,
        hint: "Currently in progress",
      },
      {
        show: settings?.showMonthlyRevenue ?? true,
        title: "Monthly Revenue",
        value: `ETB ${totalMonthlyRevenue.toLocaleString()}`,
        icon: CreditCard,
        color: "amber" as const,
        href: "/admin/payments",
        hint: "Paid this month",
      },
      {
        show: settings?.showOutstanding ?? true,
        title: "Outstanding",
        value: `ETB ${outstandingRemaining.toLocaleString()}`,
        icon: CreditCard,
        color: "amber" as const,
        href: "/admin/remaining",
        hint: "Remaining balances",
      },
      {
        show: settings?.showAttendanceRate ?? true,
        title: "Attendance Rate (30d)",
        value: `${attendanceRate}%`,
        icon: GraduationCap,
        color: "purple" as const,
        hint: "Average attendance this month",
      },
      {
        show: settings?.showCertificates ?? true,
        title: "Certificates Pending",
        value: pendingCertificates,
        icon: GraduationCap,
        color: "purple" as const,
        href: "/admin/certificates",
        hint: "Waiting for delivery",
      },
    ].filter((card) => card.show);

    const topTeacher = await getTopPerformingTeacher(campusId ?? undefined);

    const adminName = adminUser
      ? `${adminUser.firstName} ${adminUser.lastName}`
      : "Admin";

    const tableHeadClass =
      "text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground";
    const tableRowClass =
      "border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/30";

    return (
      <div className="space-y-6 sm:space-y-8">
        <DashboardHero
          adminName={adminName}
          campusName={adminUser?.campus?.name}
          dateLabel={dateLabel}
        />

        <PaymentAlerts
          overdueCount={overduePayments}
          dueSoonCount={dueSoonPayments}
        />

        {topTeacher && (
          <Link href={`/admin/teachers/${topTeacher.teacher.id}`}>
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

        {pendingCertificates > 0 && (
          <Link href="/admin/certificates">
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
                <Link key={c.id} href={`/admin/classes/${c.id}`}>
                  <div className="rounded-2xl border-2 border-blue-100 bg-white p-4 transition-all hover:border-blue-300 dark:border-blue-900/30 dark:bg-gray-900 dark:hover:border-blue-600">
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
                      •{" "}
                      {CLASS_DAYS[c.days as keyof typeof CLASS_DAYS] ?? c.days}
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

        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overview
          </p>
          {kpiCards.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {kpiCards.map((card) => (
                <KpiCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                  href={card.href}
                  hint={card.hint}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed bg-white p-6 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              All dashboard KPI cards are hidden. Open Settings to turn them
              back on.
            </div>
          )}
        </section>

        {nextEvent && (
          <Link href="/admin/events">
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-4 transition-opacity hover:opacity-90">
              <div className="flex items-center gap-3">
                {nextEvent.thumbnailUrl ? (
                  <Image
                    src={nextEvent.thumbnailUrl}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
                    🎉
                  </div>
                )}
                <div>
                  <p className="font-medium text-purple-200 text-xs">
                    Upcoming Event
                  </p>
                  <p className="font-bold text-white">{nextEvent.title}</p>
                  <p className="text-purple-200 text-xs">
                    {new Date(nextEvent.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    • {nextEvent.time}
                  </p>
                </div>
              </div>
              <span className="text-white text-xl">→</span>
            </div>
          </Link>
        )}

        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trends
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <TrendChart
              title="Monthly revenue"
              subtitle="30-day payment trend"
              value={`ETB ${totalMonthlyRevenue.toLocaleString()}`}
              data={revenueSeries}
              accent="#0ea5e9"
            />
            <TrendChart
              title="New students per day"
              subtitle="Registrations over the last 30 days"
              value={newStudents.length}
              data={registrationSeries}
              accent="#8b5cf6"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly activity
              </p>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Enrollments this week
              </h2>
            </div>
            <div className="w-fit rounded-2xl border border-border/60 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary">
              {weeklyEnrollments.length} new in 7 days
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <ActivityTableCard
              title="Latest weekly enrollments"
              subtitle="Most recent sign-ups from the past 7 days"
              badge={`${weeklyEnrollments.length} total`}
            >
              {weeklyEnrollments.length > 0 ? (
                <table className="min-w-full text-sm">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className="pb-3 pr-4">Student</th>
                      <th className="pb-3 pr-4">Course</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {weeklyEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className={tableRowClass}>
                        <td className="py-3 pr-4 font-medium">
                          {enrollment.student.user.firstName}{" "}
                          {enrollment.student.user.lastName}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {enrollment.course.title}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {enrollment.createdAt.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No enrollments this week yet.
                </p>
              )}
            </ActivityTableCard>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:rounded-3xl sm:p-5">
                <p className="text-sm font-semibold text-foreground">
                  Enrollments by day
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {weeklyEnrollmentSeries.map((point) => (
                    <div
                      key={point.label}
                      className="rounded-xl border border-border/50 bg-muted/30 px-1.5 py-2.5 text-center"
                    >
                      <p className="text-base font-bold text-foreground">
                        {point.value}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {point.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm sm:rounded-3xl sm:p-5">
                <p className="text-sm font-semibold text-muted-foreground">
                  Weekly total
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {weeklyEnrollments.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enrollments created in the past 7 days
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2 xl:gap-6">
          <ActivityTableCard
            title="Recent enrollments"
            subtitle="Latest student course activity"
            badge={`${recentEnrollments.length} entries`}
          >
            <table className="min-w-full text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Course</th>
                  <th className="pb-3 pr-4">Start</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {(recentEnrollments as RecentEnrollment[]).map((e) => (
                  <tr key={e.id} className={tableRowClass}>
                    <td className="py-3 pr-4 font-medium">
                      {e.student.user.firstName} {e.student.user.lastName}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {e.course.title}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {e.startDate.toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ActivityTableCard>

          <ActivityTableCard
            title="Recent payments"
            subtitle="Most recent student transactions"
            badge={`${recentPayments.length} payments`}
          >
            <table className="min-w-full text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">Course</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4 hidden sm:table-cell">Method</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {(recentPayments as RecentPayment[]).map((p) => (
                  <tr key={p.id} className={tableRowClass}>
                    <td className="py-3 pr-4 font-medium">
                      {p.user.firstName} {p.user.lastName}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {p.enrollment.course.title}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      ETB {p.amount.toLocaleString()}
                    </td>
                    <td className="hidden py-3 pr-4 text-muted-foreground sm:table-cell">
                      {p.method ?? "-"}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ActivityTableCard>
        </section>
      </div>
    );
  } catch (error: any) {
    const msg = (error?.message ?? String(error)).toLowerCase();
    const isDbError =
      msg.includes("can't reach database") ||
      msg.includes("etimedout") ||
      msg.includes("connection") ||
      msg.includes("p1001") ||
      msg.includes("p1002");

    if (isDbError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center">
            <span className="text-3xl">🔌</span>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Database Waking Up
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
              The database server is starting up. This happens after periods of
              inactivity. Please wait a moment and refresh the page.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition-colors"
          >
            Try Again
          </Link>
        </div>
      );
    }

    throw error;
  }

  return <div>Admin Dashboard</div>;
}
