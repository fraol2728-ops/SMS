import { COCForm } from "@/components/admin/coc/COCForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";

export default async function NewCOCPage() {
  await requireAdmin();
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Add COC Student" />
      <COCForm />
    </div>
  );
}
