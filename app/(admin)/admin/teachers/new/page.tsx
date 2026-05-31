import { PageHeader } from "@/components/admin/shared/PageHeader";
import { TeacherForm } from "@/components/admin/teachers/TeacherForm";
import { requireAdmin } from "@/lib/auth-check";

export const dynamic = "force-dynamic";

export default async function NewTeacherPage({
  searchParams,
}: {
  searchParams?: Promise<{
    fromWaitlist?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const defaultValues = params?.fromWaitlist
    ? {
        firstName: params.firstName ?? "",
        lastName: params.lastName ?? "",
        phone: params.phone ?? "",
        waitlistId: params.fromWaitlist,
      }
    : undefined;
  return (
    <div className="space-y-6">
      <PageHeader title="Add teacher" />
      <TeacherForm defaultValues={defaultValues} />
    </div>
  );
}
