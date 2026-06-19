import { DocsLayout } from "@/components/shared/docs/DocsLayout";
import { adminDocs } from "@/lib/docs/admin-docs";

export default function AdminDocsPage() {
  return (
    <DocsLayout
      title="Docs"
      subtitle="A complete guide to using the Admin Portal"
      sections={adminDocs}
      accentColor="blue"
    />
  );
}
