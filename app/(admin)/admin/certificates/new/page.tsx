export const dynamic = "force-dynamic";

import { ManualCertificateForm } from "@/components/admin/certificates/ManualCertificateForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function NewCertificatePage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const courses = await prisma.course.findMany({
    where: { isActive: true, campusId: campusId ?? undefined },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Add Certificate Manually" />
      <ManualCertificateForm courses={courses} />
    </div>
  );
}
