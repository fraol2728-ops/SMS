import { BookOpen, CreditCard, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/admin/shared/KpiCard";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { getCurrentUserCampusId } from "@/lib/campus";
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
  const campusId = await getCurrentUserCampusId();
  const campusCourseWhere = campusId ? { course: { campusId } } : {};
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);
  const [
    totalStudents,
    activeEnrollments,
    activeCourses,
    monthlyRevenue,
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
          value={`ETB ${(monthlyRevenue._sum.amount ?? 0).toLocaleString()}`}
          icon={CreditCard}
          color="amber"
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Recent enrollments</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Student name</th>
              <th>Course</th>
              <th>Start date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(recentEnrollments as RecentEnrollment[]).map((e) => (
              <tr key={e.id}>
                <td>
                  {e.student.user.firstName} {e.student.user.lastName}
                </td>
                <td>{e.course.title}</td>
                <td>{e.startDate.toLocaleDateString()}</td>
                <td>
                  <StatusBadge status={e.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Recent payments</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Student name</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(recentPayments as RecentPayment[]).map((p) => (
              <tr key={p.id}>
                <td>
                  {p.user.firstName} {p.user.lastName}
                </td>
                <td>{p.enrollment.course.title}</td>
                <td>ETB {p.amount.toLocaleString()}</td>
                <td>{p.method}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>{p.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
