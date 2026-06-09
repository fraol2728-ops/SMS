export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CertificateDetailClient } from "@/components/admin/certificates/CertificateDetailClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminCertificateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};

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
      <Link href={`/super-admin/certificates?campusId=${campusId ?? ""}`}>
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
