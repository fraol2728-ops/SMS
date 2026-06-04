import { COCForm } from "@/components/admin/coc/COCForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";

export default function SuperAdminNewCOCPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Add COC Student" />
      <COCForm redirectTo="/super-admin/coc" />
    </div>
  );
}
