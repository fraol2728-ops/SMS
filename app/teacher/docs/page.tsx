import { DocsLayout } from "@/components/shared/docs/DocsLayout";
import { teacherDocs } from "@/lib/docs/teacher-docs";

export default function TeacherDocsPage() {
  return (
    <DocsLayout
      title="Docs"
      subtitle="A complete guide to using your Teacher Portal"
      sections={teacherDocs}
      accentColor="green"
    />
  );
}
