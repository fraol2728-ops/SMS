export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { CertificateDetailClient } from "@/components/admin/certificates/CertificateDetailClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
export default async function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { student: { include: { user: true } }, course: true },
  });
  if (!cert) notFound();
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Certificate Details" />
      <CertificateDetailClient cert={cert} />
    </div>
  );
}
