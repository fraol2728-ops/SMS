import { RequestForm } from "@/components/admin/requests/RequestForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";

export default function SuperAdminNewRequestPage() {
  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="Add Course Request" />
      <RequestForm redirectTo="/super-admin/requests" />
    </div>
  );
}
