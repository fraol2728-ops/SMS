import { CourseForm } from "@/components/admin/courses/CourseForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";

export const dynamic = "force-dynamic";

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add course" />
      <CourseForm />
    </div>
  );
}
