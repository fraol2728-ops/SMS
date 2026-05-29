import { BookOpen, CreditCard, GraduationCap, Users } from "lucide-react";
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
  const [
    totalStudents,
    activeEnrollments,
    activeCourses,
    monthlyRevenue,
    recentEnrollments,
    recentPayments,
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
  ]);
  return (
    <div className="space-y-6">
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
