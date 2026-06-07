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
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { buildTrendSeries } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

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
  const { userId } = await auth();
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const adminUser = userId
    ? await prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          firstName: true,
          lastName: true,
          campus: { select: { name: true } },
        },
      })
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
  const [
    totalStudents,
    activeEnrollments,
    activeCourses,
    revenue,
    monthlyRevenue,
    totalRemaining,
    payments,
    newStudents,
    weeklyEnrollments,
    recentEnrollments,
    recentPayments,
    overduePayments,
    dueSoonPayments,
    nextEvent,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "STUDENT", ...(campusId ? { campusId } : {}) },
    }),
    prisma.enrollment.count({
      where: { status: "ACTIVE", ...campusCourseWhere },
    }),
    prisma.course.count({
      where: { isActive: true, ...(campusId ? { campusId } : {}) },
    }),
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        user: campusId ? { campusId } : undefined,
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: monthStart },
        user: campusId ? { campusId } : undefined,
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
    prisma.payment.findMany({
      where: {
        status: "PAID",
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
      where: campusId ? { enrollment: { course: { campusId } } } : undefined,
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
  ]);

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
  const totalRevenue = revenue._sum.amount ?? 0;
  const totalMonthlyRevenue = monthlyRevenue._sum.amount ?? 0;
  const outstandingRemaining = totalRemaining._sum.remainingAmount ?? 0;

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

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Overview
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <KpiCard
            title="Total Students"
            value={totalStudents}
            icon={Users}
            color="blue"
            href="/admin/students"
            hint="All registered students"
          />
          <KpiCard
            title="Active Enrollments"
            value={activeEnrollments}
            icon={BookOpen}
            color="green"
            hint="Currently in progress"
          />
          <KpiCard
            title="Active Courses"
            value={activeCourses}
            icon={GraduationCap}
            color="purple"
            href="/admin/courses"
          />
          <KpiCard
            title="Total Revenue"
            value={`ETB ${totalRevenue.toLocaleString()}`}
            icon={CreditCard}
            color="amber"
            href="/admin/payments"
          />
          <KpiCard
            title="This Month"
            value={`ETB ${totalMonthlyRevenue.toLocaleString()}`}
            icon={CreditCard}
            color="amber"
            hint="Paid this month"
          />
          <KpiCard
            title="Outstanding"
            value={`ETB ${outstandingRemaining.toLocaleString()}`}
            icon={CreditCard}
            color="amber"
            href="/admin/remaining"
            hint="Remaining balances"
          />
        </div>
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
}
