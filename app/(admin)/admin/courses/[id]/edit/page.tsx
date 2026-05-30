import { notFound } from "next/navigation";
import { CourseForm } from "@/components/admin/courses/CourseForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();
  const c = await prisma.course.findFirst({
    where: { id, ...(campusId ? { campusId } : {}) },
  });
  if (!c) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit course" />
      <CourseForm defaultValues={c} />
    </div>
  );
}
