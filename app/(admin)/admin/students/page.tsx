import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentsTable } from "@/components/admin/students/StudentsTable";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, include: { studentProfile: { include: { enrollments: { include: { course: true } } } } }, orderBy: { createdAt: "desc" } });
  const rows = students.map((s:any) => {
    const enrollments = s.studentProfile?.enrollments ?? [];
    const recent = [...enrollments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return {
      id: s.id,
      studentCode: s.studentProfile?.studentCode ?? "-",
      fullName: `${s.firstName} ${s.lastName}`,
      email: s.email,
      phone: s.phone ?? "-",
      courses: enrollments.length,
      status: enrollments.some((e:any) => e.status === "ACTIVE") ? "ACTIVE" : recent?.status,
    };
  });

  return <div><PageHeader title="Students" action={{ label: "Add student", href: "/admin/students/new" }} /><StudentsTable students={rows} /></div>;
}
