import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import { prisma } from "@/lib/prisma";

export default async function NewStudentPage() {
  const courses = await prisma.course.findMany({ where: { isActive: true } });

  return (
    <div className="space-y-6">
      <PageHeader title="Register new student" />
      {courses.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-800 font-medium">No active courses found</p>
          <p className="text-amber-600 text-sm">
            You need to create a course before registering students.
            <a href="/admin/courses/new" className="underline ml-1">
              Create a course first
            </a>
          </p>
        </div>
      )}
      <StudentForm courses={courses} />
    </div>
  );
}
