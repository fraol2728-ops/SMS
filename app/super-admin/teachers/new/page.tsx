export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/admin/shared/PageHeader";
import { TeacherForm } from "@/components/admin/teachers/TeacherForm";

export default async function SuperAdminNewTeacherPage({
  searchParams,
}: {
  searchParams?: Promise<{
    campusId?: string;
    fromWaitlist?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>;
}) {
  const { campusId, fromWaitlist, firstName, lastName, phone } =
    (await searchParams) ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title="Add Teacher" />
      <TeacherForm
        redirectBasePath={`/super-admin/teachers?campusId=${campusId ?? ""}`}
        defaultValues={
          fromWaitlist
            ? {
                firstName: firstName ?? "",
                lastName: lastName ?? "",
                phone: phone ?? "",
                waitlistId: fromWaitlist,
              }
            : undefined
        }
      />
    </div>
  );
}
