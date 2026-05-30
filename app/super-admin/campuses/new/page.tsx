import { PageHeader } from "@/components/admin/shared/PageHeader";
import { CampusForm } from "@/components/super-admin/CampusForm";

export default function NewCampusPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add campus" />
      <CampusForm />
    </div>
  );
}
