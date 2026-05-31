import { BookOpen, CreditCard, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
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
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const campusCourseWhere = campusId ? { course: { campusId } } : {};
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
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
    monthlyRevenue,
    payments,
    newStudents,
    weeklyEnrollments,
    recentEnrollments,
    recentPayments,
    overduePayments,
    dueSoonPayments,
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
        paidAt: { gte: firstDay },
        ...(campusId ? { enrollment: { course: { campusId } } } : {}),
      },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: chartStart },
        ...(campusId ? { enrollment: { course: { campusId } } } : {}),
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
  ]);

  const revenueSeries = buildTrendSeries(
    payments,
    30,
    (item) => item.paidAt!,
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
  const totalMonthlyRevenue = monthlyRevenue._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      {overduePayments > 0 || dueSoonPayments > 0 ? (
        <div className="space-y-3">
          {overduePayments > 0 ? (
            <Link href="/admin/remaining">
              <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <span className="font-bold text-red-600">
                      {overduePayments}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">
                      Overdue Payments
                    </p>
                    <p className="text-sm text-red-600">
                      {overduePayments} student{overduePayments > 1 ? "s" : ""}{" "}
                      have overdue remaining payments
                    </p>
                  </div>
                </div>
                <span className="text-sm text-red-500">View →</span>
              </div>
            </Link>
          ) : null}

          {dueSoonPayments > 0 ? (
            <Link href="/admin/remaining">
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <span className="font-bold text-amber-600">
                      {dueSoonPayments}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">
                      Due This Week
                    </p>
                    <p className="text-sm text-amber-600">
                      {dueSoonPayments} student{dueSoonPayments > 1 ? "s" : ""}{" "}
                      have payments due within 7 days
                    </p>
                  </div>
                </div>
                <span className="text-sm text-amber-500">View →</span>
              </div>
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="Active Enrollments"
          value={activeEnrollments}
          icon={BookOpen}
          color="green"
        />
        <KpiCard
          title="Active Courses"
          value={activeCourses}
          icon={GraduationCap}
          color="purple"
        />
        <KpiCard
          title="Monthly Revenue"
          value={`ETB ${totalMonthlyRevenue.toLocaleString()}`}
          icon={CreditCard}
          color="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Monthly revenue"
          subtitle="30-day payment trend"
          value={`ETB ${totalMonthlyRevenue.toLocaleString()}`}
          data={revenueSeries}
          accent="#0284c7"
        />
        <TrendChart
          title="New students per day"
          subtitle="Registrations over the last 30 days"
          value={newStudents.length}
          data={registrationSeries}
          accent="#9333ea"
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              Weekly activity
            </p>
            <h2 className="text-2xl font-semibold">
              Recent enrollments this week
            </h2>
          </div>
          <div className="rounded-3xl bg-slate-950/5 px-4 py-3 text-sm font-semibold text-slate-900">
            {weeklyEnrollments.length} enrollments in the last 7 days
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="px-6 py-5 border-b bg-slate-50">
              <p className="font-semibold">Latest weekly enrollments</p>
              <p className="text-sm text-muted-foreground">
                Showing the most recent 12 enrollments.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyEnrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        {enrollment.student.user.firstName}{" "}
                        {enrollment.student.user.lastName}
                      </td>
                      <td className="px-4 py-3">{enrollment.course.title}</td>
                      <td className="px-4 py-3">
                        {enrollment.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border bg-slate-950/5 p-5 shadow-sm">
              <p className="text-sm font-semibold">Enrollments by day</p>
              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] text-slate-600">
                {weeklyEnrollmentSeries.map((point) => (
                  <div
                    key={point.label}
                    className="rounded-2xl bg-white px-2 py-3 shadow-sm"
                  >
                    <p className="font-semibold">{point.value}</p>
                    <p>{point.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border bg-slate-950/5 p-5 shadow-sm">
              <p className="text-sm font-semibold">Top weekly metric</p>
              <p className="mt-2 text-3xl font-semibold">
                {weeklyEnrollments.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Enrollments created in the past 7 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold">Recent enrollments</h3>
              <p className="text-sm text-slate-500">
                Latest student course activity.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
              {recentEnrollments.length} entries
            </span>
          </div>
          <div className="overflow-x-auto px-6 py-4">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="pb-3 pr-6">Student</th>
                  <th className="pb-3 pr-6">Course</th>
                  <th className="pb-3 pr-6">Start date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(recentEnrollments as RecentEnrollment[]).map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 pr-6 font-medium text-slate-900">
                      {e.student.user.firstName} {e.student.user.lastName}
                    </td>
                    <td className="py-4 pr-6">{e.course.title}</td>
                    <td className="py-4 pr-6">
                      {e.startDate.toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold">Recent payments</h3>
              <p className="text-sm text-slate-500">
                Most recent student transactions.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
              {recentPayments.length} payments
            </span>
          </div>
          <div className="overflow-x-auto px-6 py-4">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="pb-3 pr-6">Student</th>
                  <th className="pb-3 pr-6">Course</th>
                  <th className="pb-3 pr-6">Amount</th>
                  <th className="pb-3 pr-6">Method</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(recentPayments as RecentPayment[]).map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 pr-6 font-medium text-slate-900">
                      {p.user.firstName} {p.user.lastName}
                    </td>
                    <td className="py-4 pr-6">{p.enrollment.course.title}</td>
                    <td className="py-4 pr-6">
                      ETB {p.amount.toLocaleString()}
                    </td>
                    <td className="py-4 pr-6">{p.method ?? "-"}</td>
                    <td className="py-4">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
