import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
export default async function Payments() {
  await requireAdmin();
  return (
    <PageHeader
      title="Payments"
      description="Payments management coming soon."
    />
  );
}
