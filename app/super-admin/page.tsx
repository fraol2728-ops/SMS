export const dynamic = "force-dynamic";

import {
  BookOpen,
  Building2,
  CreditCard,
  GraduationCap,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/admin/shared/KpiCard";
import { prisma } from "@/lib/prisma";

type CampusBreakdown = {
  id: string;
  name: string;
  isActive: boolean;
  _count: { users: number; courses: number };
};

export default async function SuperAdminDashboard() {
  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    _totalCampuses,
    campuses,
    monthlyRevenue,
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
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">All campuses combined</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="Total Teachers"
          value={totalTeachers}
          icon={GraduationCap}
          color="green"
        />
        <KpiCard
          title="Active Courses"
          value={totalCourses}
          icon={BookOpen}
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
