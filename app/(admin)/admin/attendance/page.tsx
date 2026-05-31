import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
export default async function Attendance() {
  await requireAdmin();
  return (
    <PageHeader
      title="Attendance"
      description="Attendance management coming soon."
    />
  );
}
