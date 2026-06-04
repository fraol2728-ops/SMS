export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CourseForm } from "@/components/admin/courses/CourseForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";

export default async function SuperAdminNewCoursePage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="Add Course" />
      <CourseForm
        campusId={campusId}
        redirectTo={`/super-admin/courses?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
