export const dynamic = "force-dynamic";

import { BackupClient } from "@/components/admin/backup/BackupClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";

export default async function BackupPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Import"
        description="Download data as Excel or import from Excel files"
      />
      <BackupClient campusId={null} />
    </div>
  );
}
