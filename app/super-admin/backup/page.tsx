export const dynamic = "force-dynamic";

import { BackupClient } from "@/components/admin/backup/BackupClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireSuperAdmin } from "@/lib/auth-check";

export default async function SuperAdminBackupPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  await requireSuperAdmin();
  const { campusId } = (await searchParams) ?? {};
  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Import"
        description="Download or import data for any campus"
      />
      <BackupClient campusId={campusId ?? null} />
    </div>
  );
}
