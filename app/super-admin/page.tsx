export const dynamic = "force-dynamic";

import {
  BookOpen,
  Building2,
  CreditCard,
  GraduationCap,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/admin/shared/KpiCard";
import { TrendChart } from "@/components/admin/shared/TrendChart";
import { buildTrendSeries } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

type CampusBreakdown = {
  id: string;
  name: string;
  isActive: boolean;
  _count: { users: number; courses: number };
};

type WeeklyEnrollment = {
  id: string;
  createdAt: Date;
  student: { user: { firstName: string; lastName: string } };
  course: { title: string };
};

export default async function SuperAdminDashboard() {
  const now = new Date();
  const chartStart = new Date(now);
  chartStart.setDate(now.getDate() - 29);
  chartStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    _totalCampuses,
    campuses,
    monthlyRevenue,
    payments,
    newStudents,
    weeklyEnrollments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.course.count({ where: { isActive: true } }),
    prisma.campus.count(),
    prisma.campus.findMany({
      include: {
        _count: {
          select: {
            users: { where: { role: "STUDENT" } },
            courses: true,
          },
        },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: chartStart },
      },
      select: { amount: true, paidAt: true },
    }),
    prisma.user.findMany({
      where: {
        role: "STUDENT",
        createdAt: { gte: chartStart },
      },
      select: { createdAt: true },
    }),
    prisma.enrollment.findMany({
      where: { createdAt: { gte: weekStart } },
      orderBy: { createdAt: "desc" },
      include: { student: { include: { user: true } }, course: true },
      take: 12,
    }),
  ]);

  const revenueSeries = buildTrendSeries(payments, 30, (item) => item.paidAt!, (item) => item.amount);
  const registrationSeries = buildTrendSeries(newStudents, 30, (item) => item.createdAt, () => 1);
  const weeklyEnrollmentSeries = buildTrendSeries(weeklyEnrollments, 7, (item) => item.createdAt, () => 1);
  const totalMonthlyRevenue = monthlyRevenue._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">All campuses combined</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Students" value={totalStudents} icon={Users} color="blue" />
        <KpiCard title="Total Teachers" value={totalTeachers} icon={GraduationCap} color="green" />
        <KpiCard title="Active Courses" value={totalCourses} icon={BookOpen} color="purple" />
        <KpiCard title="Monthly Revenue" value={`ETB ${totalMonthlyRevenue.toLocaleString()}`} icon={CreditCard} color="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart
          title="Monthly revenue"
          subtitle="All campuses, 30-day trend"
          value={`ETB ${totalMonthlyRevenue.toLocaleString()}`}
          data={revenueSeries}
          accent="#0f766e"
        />
        <TrendChart
          title="New student signups"
          subtitle="Registrations over the last 30 days"
          value={newStudents.length}
          data={registrationSeries}
          accent="#6366f1"
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Weekly insights</p>
            <h2 className="text-2xl font-semibold">Recent enrollments</h2>
          </div>
          <div className="rounded-3xl bg-slate-950/5 px-4 py-3 text-sm font-semibold text-slate-900">
            {weeklyEnrollments.length} enrollments in the last 7 days
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="px-6 py-5 border-b bg-slate-50">
              <p className="font-semibold">Latest weekly enrollments</p>
              <p className="text-sm text-muted-foreground">Showing the most recent 12 enrollments.</p>
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
                    <tr key={enrollment.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">
                        {enrollment.student.user.firstName} {enrollment.student.user.lastName}
                      </td>
                      <td className="px-4 py-3">{enrollment.course.title}</td>
                      <td className="px-4 py-3">{enrollment.createdAt.toLocaleDateString()}</td>
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
                  <div key={point.label} className="rounded-2xl bg-white px-2 py-3 shadow-sm">
                    <p className="font-semibold">{point.value}</p>
                    <p>{point.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border bg-slate-950/5 p-5 shadow-sm">
              <p className="text-sm font-semibold">Top weekly metric</p>
              <p className="mt-2 text-3xl font-semibold">{weeklyEnrollments.length}</p>
              <p className="text-sm text-muted-foreground">Enrollments created in the past 7 days.</p>
            </div>
          </div>
        </div>
      </section>

      <div>
        <h2 className="text-lg font-semibold mb-4">Campus breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(campuses as CampusBreakdown[]).map((campus) => (
            <div key={campus.id} className="bg-white border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="text-blue-500" size={20} />
                <h3 className="font-semibold text-lg">{campus.name}</h3>
                <span
                  className={`ml-auto text-xs px-2 py-1 rounded-full ${campus.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {campus.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold">{campus._count.users}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Courses</p>
                  <p className="text-2xl font-bold">{campus._count.courses}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
