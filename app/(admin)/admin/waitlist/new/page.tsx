import { PageHeader } from "@/components/admin/shared/PageHeader";
import { WaitlistForm } from "@/components/admin/waitlist/WaitlistForm";
import { requireAdmin } from "@/lib/auth-check";
export default async function NewWaitlistPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader title="Add to Waiting List" />
      <WaitlistForm />
    </div>
  );
}
