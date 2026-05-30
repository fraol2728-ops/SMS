import { ReportGenerator } from "@/components/admin/reports/ReportGenerator";
import { PageHeader } from "@/components/admin/shared/PageHeader";

export const dynamic = "force-dynamic";

export default function SuperAdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate reports across all campuses"
      />
      <ReportGenerator />
    </div>
  );
}
