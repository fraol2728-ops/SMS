import { RequestForm } from "@/components/admin/requests/RequestForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
export default async function NewRequestPage() {
  await requireAdmin();
  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Add Course Request" />
      <RequestForm />
    </div>
  );
}
