import { DocsLayout } from "@/components/shared/docs/DocsLayout";
import { superAdminDocs } from "@/lib/docs/super-admin-docs";

export default function SuperAdminDocsPage() {
  return (
    <DocsLayout
      title="Docs"
      subtitle="A complete guide to using the Super Admin Portal"
      sections={superAdminDocs}
      accentColor="indigo"
    />
  );
}
