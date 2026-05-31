import { CourseForm } from "@/components/admin/courses/CourseForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader title="Add course" />
      <CourseForm />
    </div>
  );
}
