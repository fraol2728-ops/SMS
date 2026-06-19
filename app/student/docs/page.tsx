import { DocsLayout } from "@/components/shared/docs/DocsLayout";
import { studentDocs } from "@/lib/docs/student-docs";

export default function StudentDocsPage() {
  return (
    <DocsLayout
      title="Docs"
      subtitle="A complete guide to using your Student Portal"
      sections={studentDocs}
      accentColor="purple"
    />
  );
}
