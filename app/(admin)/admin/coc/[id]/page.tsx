export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { COCDetailClient } from "@/components/admin/coc/COCDetailClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function COCDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const student = await prisma.cOCStudent.findUnique({
    where: { id: params.id },
    include: { studentProfile: { include: { user: true } }, campus: true },
  });
  if (!student) notFound();
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title={student.fullName} description="COC Student Details" />
      <COCDetailClient student={student} />
    </div>
  );
}
