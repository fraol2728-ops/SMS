import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import { prisma } from "@/lib/prisma";

export default async function NewStudentPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
    select: { id: true, title: true, fee: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Register new student" />
      {courses.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No active courses exist yet. Please{" "}
          <Link href="/admin/courses/new" className="font-semibold underline">
            add a course
          </Link>{" "}
          before registering a student.
        </div>
      ) : null}
      <StudentForm courses={courses} />
    </div>
  );
}
