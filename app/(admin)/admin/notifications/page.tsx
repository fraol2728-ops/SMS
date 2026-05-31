import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
export default async function Notifications() {
  await requireAdmin();
  return (
    <PageHeader
      title="Notifications"
      description="Notifications center coming soon."
    />
  );
}
