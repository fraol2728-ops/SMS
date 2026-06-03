export const dynamic = "force-dynamic";

import { ReportGenerator } from "@/components/admin/reports/ReportGenerator";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireSuperAdmin } from "@/lib/auth-check";

export default async function SuperAdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  await requireSuperAdmin();
  await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate campus-aware reports" />
      <ReportGenerator />
    </div>
  );
}
