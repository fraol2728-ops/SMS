import { BookOpen, CreditCard, UserCheck, Users } from "lucide-react";
import { KpiCard } from "@/components/admin/shared/KpiCard";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const [students, activeEnrollments, courses, paidAgg, recentEnrollments, recentPayments] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.course.count({ where: { isActive: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: start } } }),
    prisma.enrollment.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { student: { include: { user: true } }, course: true } }),
    prisma.payment.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { user: true } })
  ]);
  return <div className="space-y-6"><div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"><KpiCard title="Total students" value={students} icon={Users} color="bg-blue-50"/><KpiCard title="Active enrollments" value={activeEnrollments} icon={UserCheck} color="bg-green-50"/><KpiCard title="Courses offered" value={courses} icon={BookOpen} color="bg-purple-50"/><KpiCard title="Payments this month" value={`$${paidAgg._sum.amount ?? 0}`} icon={CreditCard} color="bg-yellow-50"/></div><div className="rounded-lg border bg-white p-4"><h2 className="mb-3 font-semibold">Recent enrollments</h2><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Course</TableHead><TableHead>Start date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{recentEnrollments.map(e=><TableRow key={e.id}><TableCell>{e.student.user.firstName} {e.student.user.lastName}</TableCell><TableCell>{e.course.title}</TableCell><TableCell>{e.startDate.toLocaleDateString()}</TableCell><TableCell><StatusBadge status={e.status}/></TableCell></TableRow>)}</TableBody></Table></div><div className="rounded-lg border bg-white p-4"><h2 className="mb-3 font-semibold">Recent payments</h2><Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{recentPayments.map(p=><TableRow key={p.id}><TableCell>{p.user.firstName} {p.user.lastName}</TableCell><TableCell>${p.amount}</TableCell><TableCell>{p.method}</TableCell><TableCell><StatusBadge status={p.status}/></TableCell><TableCell>{p.createdAt.toLocaleDateString()}</TableCell></TableRow>)}</TableBody></Table></div></div>;
}
