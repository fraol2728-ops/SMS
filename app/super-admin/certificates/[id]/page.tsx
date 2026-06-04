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

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      course: true,
    },
  });

  if (!certificate) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/super-admin/certificates?campusId=${campusId ?? ""}`}>
        <button
          className="text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back
        </button>
      </Link>
      <PageHeader title="Certificate Details" />
      <CertificateDetailClient
        cert={certificate}
        redirectTo={`/super-admin/certificates?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
