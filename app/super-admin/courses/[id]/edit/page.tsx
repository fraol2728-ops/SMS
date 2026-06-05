export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { CourseEditForm } from "@/components/super-admin/CourseEditForm";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminCourseEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};
  const course = await prisma.course.findUnique({ where: { id } });

  if (!course) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title={`Edit ${course.title}`} />
      <CourseEditForm course={course} campusId={campusId} />
    </div>
  );
}
