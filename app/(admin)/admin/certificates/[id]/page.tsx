export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateDetailClient } from "@/components/admin/certificates/CertificateDetailClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function AdminCertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, id: true } },
        },
      },
      course: true,
      claimedBy: { select: { firstName: true, lastName: true } },
    },
  });

  if (!cert) notFound();

  const studentRemaining = cert.studentId
    ? await prisma.paymentRemaining.findFirst({
        where: {
          enrollment: { student: { id: cert.studentId } },
          status: { not: "PAID" },
        },
        select: { remainingAmount: true, dueDate: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <Link href="/admin/certificates">
        <button
          className="mb-2 flex items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back to Certificates
        </button>
      </Link>
      <PageHeader title="Certificate Details" />
      <CertificateDetailClient
        cert={cert}
        studentRemaining={studentRemaining}
      />
    </div>
  );
}
